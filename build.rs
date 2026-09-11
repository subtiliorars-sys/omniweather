// crazy-gazelle-2026

[build]
target = "x86_64-unknown-linux-gnu"

[includes]
"../Cargo.toml"

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = "symbols"

[install]
default_run = "crazy-gazelle"
