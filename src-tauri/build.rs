fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "check_for_updates_manual",
            "get_cached_update_status",
            "install_available_update",
        ]),
    ))
    .expect("failed to build Tauri application metadata")
}
