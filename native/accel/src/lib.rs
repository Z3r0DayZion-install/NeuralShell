use neon::prelude::*;

fn backend_name(mut cx: FunctionContext) -> JsResult<JsString> {
    #[cfg(target_os = "macos")]
    let backend = "metal";
    #[cfg(all(not(target_os = "macos"), target_os = "windows"))]
    let backend = "cuda";
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    let backend = "cpu";
    Ok(cx.string(backend))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("backendName", backend_name)?;
    Ok(())
}

