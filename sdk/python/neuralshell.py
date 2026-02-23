"""
NeuralShell Python SDK
"""

import json
import time
from typing import Optional, List, Dict, Any, Generator
from dataclasses import dataclass


@dataclass
class Message:
    role: str
    content: str
    name: Optional[str] = None


@dataclass
class Choice:
    index: int
    message: Dict[str, Any]
    finish_reason: str


@dataclass
class Usage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


@dataclass
class ChatCompletion:
    id: str
    object: str
    created: int
    model: str
    choices: List[Choice]
    usage: Usage
    request_id: str


class NeuralShellError(Exception):
    def __init__(self, message: str, code: str = None, request_id: str = None):
        super().__init__(message)
        self.code = code
        self.request_id = request_id


class NeuralShell:
    def __init__(
        self,
        base_url: str = "http://localhost:3000",
        api_key: str = None,
        admin_token: str = None,
        timeout: int = 30
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.admin_token = admin_token
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["x-prompt-token"] = self.api_key
        if self.admin_token:
            headers["x-admin-token"] = self.admin_token
        return headers

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = False,
        **kwargs
    ) -> ChatCompletion:
        """Send a chat completion request."""
        payload = {"messages": messages}
        if model:
            payload["model"] = model
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens:
            payload["max_tokens"] = max_tokens
        payload.update(kwargs)

        import urllib.request
        req = urllib.request.Request(
            f"{self.base_url}/prompt",
            data=json.dumps(payload).encode("utf-8"),
            headers=self._headers(),
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return self._parse_response(data)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            try:
                error_data = json.loads(error_body)
                raise NeuralShellError(
                    error_data.get("message", str(e)),
                    error_data.get("code"),
                    error_data.get("requestId")
                )
            except:
                raise NeuralShellError(str(e), code=str(e.code))

    def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """Stream a chat completion response."""
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "stream": True
        }
        payload.update(kwargs)

        import urllib.request
        req = urllib.request.Request(
            f"{self.base_url}/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=self._headers(),
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            for line in resp:
                line = line.decode("utf-8").strip()
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    yield data

    def _parse_response(self, data: Dict) -> ChatCompletion:
        choices = [Choice(**c) for c in data.get("choices", [])]
        usage = Usage(**data.get("usage", {}))
        return ChatCompletion(
            id=data.get("id", ""),
            object=data.get("object", "chat.completion"),
            created=data.get("created", 0),
            model=data.get("model", ""),
            choices=choices,
            usage=usage,
            request_id=data.get("requestId", "")
        )

    def health(self) -> Dict:
        """Check server health."""
        import urllib.request
        req = urllib.request.Request(f"{self.base_url}/health")
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def metrics(self) -> Dict:
        """Get server metrics."""
        import urllib.request
        req = urllib.request.Request(f"{self.base_url}/metrics/json", headers=self._headers())
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def endpoints(self) -> List[Dict]:
        """Get endpoint status."""
        import urllib.request
        req = urllib.request.Request(f"{self.base_url}/endpoints", headers=self._headers())
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("endpoints", [])

    def reset_endpoints(self) -> bool:
        """Reset endpoint state."""
        import urllib.request
        req = urllib.request.Request(
            f"{self.base_url}/endpoints/reset",
            headers=self._headers(),
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return resp.status == 200


class AsyncNeuralShell(NeuralShell):
    """Async version of NeuralShell client."""

    async def chat(self, messages: List[Dict], **kwargs):
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/prompt",
                json={"messages": messages, **kwargs},
                headers=self._headers(),
                timeout=self.timeout
            ) as resp:
                data = await resp.json()
                return self._parse_response(data)

    async def stream_chat(self, messages: List[Dict], **kwargs):
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/chat/completions",
                json={"messages": messages, "stream": True, **kwargs},
                headers=self._headers(),
                timeout=self.timeout
            ) as resp:
                async for line in resp.content:
                    line = line.decode("utf-8").strip()
                    if line.startswith("data: "):
                        yield line[6:]


if __name__ == "__main__":
    client = NeuralShell("http://localhost:3000")
    
    print("Health:", client.health())
    print("Metrics:", client.metrics())
    
    response = client.chat([
        {"role": "user", "content": "Hello!"}
    ])
    print("Response:", response.choices[0].message.content if response.choices else "No response")
