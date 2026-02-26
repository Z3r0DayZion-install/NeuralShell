use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Endpoint {
    pub name: String,
    pub url: String,
    #[serde(default)]
    pub weight: Option<f64>,
    #[serde(default)]
    pub latency_ms: Option<f64>,
    #[serde(default)]
    pub healthy: Option<bool>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Strategy {
    Adaptive,
    RoundRobin,
    Weighted,
}

fn is_healthy(ep: &Endpoint) -> bool {
    ep.healthy.unwrap_or(true)
}

fn endpoint_weight(ep: &Endpoint) -> f64 {
    let w = ep.weight.unwrap_or(1.0);
    if w.is_finite() && w > 0.0 {
        w
    } else {
        1.0
    }
}

fn endpoint_latency(ep: &Endpoint) -> f64 {
    let l = ep.latency_ms.unwrap_or(500.0);
    if l.is_finite() && l > 0.0 {
        l
    } else {
        500.0
    }
}

fn pseudo_u64(seed: u64, salt: &str) -> u64 {
    let mut h = Sha256::new();
    h.update(seed.to_le_bytes());
    h.update(salt.as_bytes());
    let out = h.finalize();
    u64::from_le_bytes(out[0..8].try_into().unwrap())
}

pub fn select_index(
    endpoints: &[Endpoint],
    strategy: Strategy,
    seed: u64,
    rr_cursor: Option<usize>,
) -> Option<usize> {
    if endpoints.is_empty() {
        return None;
    }

    let healthy: Vec<usize> = endpoints
        .iter()
        .enumerate()
        .filter(|(_, e)| is_healthy(e))
        .map(|(i, _)| i)
        .collect();

    if healthy.is_empty() {
        return None;
    }

    match strategy {
        Strategy::Adaptive => {
            let mut best: Option<(usize, f64)> = None;
            for &idx in &healthy {
                let ep = &endpoints[idx];
                let score = endpoint_latency(ep) / endpoint_weight(ep);
                match best {
                    None => best = Some((idx, score)),
                    Some((_, best_score)) if score < best_score => best = Some((idx, score)),
                    _ => {}
                }
            }
            best.map(|(idx, _)| idx)
        }
        Strategy::RoundRobin => {
            let start = rr_cursor.unwrap_or(usize::MAX);
            let pos = if start == usize::MAX {
                0
            } else {
                let cur = healthy
                    .iter()
                    .position(|&i| i == start)
                    .unwrap_or(usize::MAX);
                if cur == usize::MAX {
                    0
                } else {
                    (cur + 1) % healthy.len()
                }
            };
            Some(healthy[pos])
        }
        Strategy::Weighted => {
            let mut total = 0.0;
            for &idx in &healthy {
                total += endpoint_weight(&endpoints[idx]);
            }
            if !(total.is_finite() && total > 0.0) {
                return Some(healthy[0]);
            }

            let salt = healthy
                .iter()
                .map(|&i| endpoints[i].name.as_str())
                .collect::<Vec<_>>()
                .join("|");
            let r_u64 = pseudo_u64(seed, &salt);
            let r = (r_u64 as f64 / u64::MAX as f64) * total;

            let mut acc = 0.0;
            for &idx in &healthy {
                acc += endpoint_weight(&endpoints[idx]);
                if r <= acc {
                    return Some(idx);
                }
            }
            Some(*healthy.last().unwrap())
        }
    }
}

pub fn select_endpoint(
    endpoints: &[Endpoint],
    strategy: Strategy,
    seed: u64,
    rr_cursor: Option<usize>,
) -> Option<Endpoint> {
    select_index(endpoints, strategy, seed, rr_cursor).map(|i| endpoints[i].clone())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectRequest {
    pub endpoints: Vec<Endpoint>,
    #[serde(default = "default_strategy")]
    pub strategy: Strategy,
    #[serde(default)]
    pub seed: Option<u64>,
    #[serde(default)]
    pub rr_cursor: Option<usize>,
}

fn default_strategy() -> Strategy {
    Strategy::Adaptive
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectResponse {
    pub selected: Option<Endpoint>,
}

pub fn select_from_json(json: &str) -> Result<String, serde_json::Error> {
    let req: SelectRequest = serde_json::from_str(json)?;
    let seed = req.seed.unwrap_or(0);
    let selected = select_endpoint(&req.endpoints, req.strategy, seed, req.rr_cursor);
    let resp = SelectResponse { selected };
    serde_json::to_string(&resp)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn eps() -> Vec<Endpoint> {
        vec![
            Endpoint {
                name: "a".into(),
                url: "http://a".into(),
                weight: Some(1.0),
                latency_ms: Some(100.0),
                healthy: Some(true),
            },
            Endpoint {
                name: "b".into(),
                url: "http://b".into(),
                weight: Some(2.0),
                latency_ms: Some(300.0),
                healthy: Some(true),
            },
            Endpoint {
                name: "c".into(),
                url: "http://c".into(),
                weight: Some(1.0),
                latency_ms: Some(50.0),
                healthy: Some(false),
            },
        ]
    }

    #[test]
    fn adaptive_picks_lowest_latency_over_weight_among_healthy() {
        let endpoints = eps();
        let idx = select_index(&endpoints, Strategy::Adaptive, 0, None).unwrap();
        assert_eq!(idx, 0);
    }

    #[test]
    fn round_robin_skips_unhealthy() {
        let endpoints = eps();
        let a = select_index(&endpoints, Strategy::RoundRobin, 0, None).unwrap();
        assert_eq!(a, 0);
        let b = select_index(&endpoints, Strategy::RoundRobin, 0, Some(a)).unwrap();
        assert_eq!(b, 1);
        let a2 = select_index(&endpoints, Strategy::RoundRobin, 0, Some(b)).unwrap();
        assert_eq!(a2, 0);
    }

    #[test]
    fn weighted_is_deterministic() {
        let endpoints = eps();
        let x = select_index(&endpoints, Strategy::Weighted, 123, None).unwrap();
        let y = select_index(&endpoints, Strategy::Weighted, 123, None).unwrap();
        assert_eq!(x, y);
    }

    #[test]
    fn json_round_trip() {
        let req = SelectRequest {
            endpoints: eps(),
            strategy: Strategy::Adaptive,
            seed: Some(1),
            rr_cursor: None,
        };
        let out = select_from_json(&serde_json::to_string(&req).unwrap()).unwrap();
        let resp: SelectResponse = serde_json::from_str(&out).unwrap();
        assert!(resp.selected.is_some());
    }
}
