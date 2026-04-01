#!/usr/bin/env python3
"""
Generate WinGet multi-file manifests for the current NeuralShell release.

The generator uses local release artifacts so the produced manifests stay aligned
with the built installer and recorded checksums.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import quote


DEFAULT_PACKAGE_JSON = Path("package.json")
DEFAULT_CHECKSUMS = Path("release/checksums.txt")
DEFAULT_OUTPUT_ROOT = Path("release/winget/manifests")
DEFAULT_REPO_URL = "https://github.com/Z3r0DayZion-install/NeuralShell"
DEFAULT_PACKAGE_ID = "NeuralShellTeam.NeuralShell"
DEFAULT_PUBLISHER = "NeuralShell Team"
DEFAULT_PACKAGE_NAME = "NeuralShell"
DEFAULT_SHORT_DESCRIPTION = (
    "Offline-first desktop workstation with strict IPC validation and release provenance gates."
)
DEFAULT_DESCRIPTION = (
    "NeuralShell is a desktop workstation for local AI and developer workflows with "
    "strict IPC validation, offline-first defaults, and release provenance gates."
)
DEFAULT_TAGS = ["ai", "desktop", "developer-tools", "offline-first", "security"]
DEFAULT_MANIFEST_VERSION = "1.12.0"
GITHUB_API = "https://api.github.com/repos/{owner}/{repo}/releases/tags/v{version}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-json", default=str(DEFAULT_PACKAGE_JSON))
    parser.add_argument("--checksums", default=str(DEFAULT_CHECKSUMS))
    parser.add_argument("--output-root", default=str(DEFAULT_OUTPUT_ROOT))
    parser.add_argument("--package-id", default=DEFAULT_PACKAGE_ID)
    parser.add_argument("--publisher", default=DEFAULT_PUBLISHER)
    parser.add_argument("--package-name", default=DEFAULT_PACKAGE_NAME)
    parser.add_argument("--repo-url", default=DEFAULT_REPO_URL)
    parser.add_argument("--short-description", default=DEFAULT_SHORT_DESCRIPTION)
    parser.add_argument("--description", default=DEFAULT_DESCRIPTION)
    parser.add_argument("--installer-url", default="")
    parser.add_argument("--installer-sha256", default="")
    parser.add_argument("--manifest-version", default=DEFAULT_MANIFEST_VERSION)
    return parser.parse_args()


def load_package_version(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    version = str(data.get("version", "")).strip()
    if not version:
        raise RuntimeError(f"Missing version in {path}")
    return version


def find_installer_sha256(path: Path, version: str) -> str:
    target = f"dist/NeuralShell Setup {version}.exe"
    pattern = re.compile(r"^([a-fA-F0-9]{64})\s+(.+)$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line.strip())
        if not match:
            continue
        digest, file_path = match.groups()
        if file_path == target:
            return digest.upper()
    raise RuntimeError(f"Installer checksum not found for {target} in {path}")


def parse_repo_slug(repo_url: str) -> tuple[str, str]:
    match = re.search(r"github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", repo_url.strip())
    if not match:
        raise RuntimeError(f"Could not parse GitHub owner/repo from {repo_url}")
    return match.group(1), match.group(2)


def fetch_release_json(repo_url: str, version: str) -> dict:
    owner, repo = parse_repo_slug(repo_url)
    url = GITHUB_API.format(owner=owner, repo=repo, version=quote(version))
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "NeuralShell-WinGet-Generator",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def select_release_installer(release: dict) -> tuple[str, str, str]:
    assets = release.get("assets", [])
    for asset in assets:
        name = str(asset.get("name", "")).strip()
        if not name.lower().endswith(".exe"):
            continue
        if "setup" not in name.lower():
            continue
        browser_url = str(asset.get("browser_download_url", "")).strip()
        digest = str(asset.get("digest", "")).strip()
        sha256 = ""
        if digest.lower().startswith("sha256:"):
            sha256 = digest.split(":", 1)[1].upper()
        return name, browser_url, sha256
    raise RuntimeError("No suitable .exe release asset found in GitHub release metadata")


def default_installer_url(repo_url: str, version: str) -> str:
    asset = quote(f"NeuralShell Setup {version}.exe")
    return f"{repo_url}/releases/download/v{version}/{asset}"


def output_dir(root: Path, package_id: str, version: str) -> Path:
    publisher, package_name = package_id.split(".", 1)
    return root / package_id[0].lower() / publisher / package_name / version


def schema_header(manifest_type: str, manifest_version: str) -> str:
    return (
        "# Created with NeuralShell WinGet generator\n"
        "# yaml-language-server: "
        f"$schema=https://aka.ms/winget-manifest.{manifest_type}.{manifest_version}.schema.json\n\n"
    )


def version_manifest(package_id: str, version: str, manifest_version: str) -> str:
    return (
        f"{schema_header('version', manifest_version)}"
        f"PackageIdentifier: {package_id}\n"
        f"PackageVersion: {version}\n"
        "DefaultLocale: en-US\n"
        "ManifestType: version\n"
        f"ManifestVersion: {manifest_version}\n"
    )


def installer_manifest(
    package_id: str,
    version: str,
    installer_url: str,
    installer_sha256: str,
    release_date: str,
    manifest_version: str,
) -> str:
    return (
        f"{schema_header('installer', manifest_version)}"
        f"PackageIdentifier: {package_id}\n"
        f"PackageVersion: {version}\n"
        "InstallerType: nullsoft\n"
        "InstallModes:\n"
        "  - interactive\n"
        "  - silent\n"
        "  - silentWithProgress\n"
        f"ReleaseDate: {release_date}\n"
        "Installers:\n"
        "  - Architecture: x64\n"
        f"    InstallerUrl: {installer_url}\n"
        f"    InstallerSha256: {installer_sha256}\n"
        "ManifestType: installer\n"
        f"ManifestVersion: {manifest_version}\n"
    )


def locale_manifest(
    package_id: str,
    version: str,
    publisher: str,
    package_name: str,
    repo_url: str,
    short_description: str,
    description: str,
    manifest_version: str,
) -> str:
    tags = "".join(f"  - {tag}\n" for tag in DEFAULT_TAGS)
    privacy_url = f"{repo_url}/blob/master/docs/PRIVACY_POLICY.md"
    license_url = f"{repo_url}/blob/master/LICENSE"
    return (
        f"{schema_header('defaultLocale', manifest_version)}"
        f"PackageIdentifier: {package_id}\n"
        f"PackageVersion: {version}\n"
        "PackageLocale: en-US\n"
        f"Publisher: {publisher}\n"
        f"PublisherUrl: {repo_url}\n"
        f"PublisherSupportUrl: {repo_url}/issues/new/choose\n"
        f"Author: {publisher}\n"
        f"PrivacyUrl: {privacy_url}\n"
        f"PackageName: {package_name}\n"
        f"PackageUrl: {repo_url}\n"
        "License: MIT\n"
        f"LicenseUrl: {license_url}\n"
        "ShortDescription: "
        f"{short_description}\n"
        f"Description: {description}\n"
        "Tags:\n"
        f"{tags}"
        "ManifestType: defaultLocale\n"
        f"ManifestVersion: {manifest_version}\n"
    )


def write_file(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf-8", newline="\n")


def main() -> int:
    args = parse_args()
    package_json = Path(args.package_json)
    checksums = Path(args.checksums)
    output_root = Path(args.output_root)

    version = load_package_version(package_json)
    installer_name = ""
    installer_url = args.installer_url.strip()
    installer_sha256 = args.installer_sha256.strip().upper()
    release_date = ""

    if not installer_url or not installer_sha256:
        try:
            release = fetch_release_json(args.repo_url, version)
            installer_name, release_url, release_sha256 = select_release_installer(release)
            installer_url = installer_url or release_url
            installer_sha256 = installer_sha256 or release_sha256
            release_date = str(release.get("published_at", "")).strip().split("T", 1)[0]
        except Exception as release_err:  # noqa: BLE001
            print(f"[WARN] GitHub release asset lookup failed: {release_err}")

    if not installer_url:
        installer_url = default_installer_url(args.repo_url, version)
    if not installer_sha256:
        installer_sha256 = find_installer_sha256(checksums, version)
    if not release_date:
        release_date = "2026-03-09"

    target_dir = output_dir(output_root, args.package_id, version)

    version_path = target_dir / f"{args.package_id}.yaml"
    installer_path = target_dir / f"{args.package_id}.installer.yaml"
    locale_path = target_dir / f"{args.package_id}.locale.en-US.yaml"

    write_file(
        version_path,
        version_manifest(args.package_id, version, args.manifest_version),
    )
    write_file(
        installer_path,
        installer_manifest(
            args.package_id,
            version,
            installer_url,
            installer_sha256,
            release_date,
            args.manifest_version,
        ),
    )
    write_file(
        locale_path,
        locale_manifest(
            args.package_id,
            version,
            args.publisher,
            args.package_name,
            args.repo_url,
            args.short_description,
            args.description,
            args.manifest_version,
        ),
    )

    print(f"[SUMMARY] package_id={args.package_id} version={version}")
    print(f"[OUTPUT] {target_dir.resolve()}")
    if installer_name:
        print(f"[ASSET] {installer_name}")
    print(f"[INSTALLER_URL] {installer_url}")
    print(f"[SHA256] {installer_sha256}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
