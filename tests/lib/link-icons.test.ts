import { describe, expect, test } from "vitest";
import { getLinkIcon } from "@/lib/link-icons";

describe("getLinkIcon", () => {
  test.for([
    ["https://www.npmjs.com/package/left-pad", "npm"],
    ["https://pypi.org/project/requests/", "PyPI"],
    ["https://marketplace.visualstudio.com/items?itemName=foo.bar", "VSCode Marketplace"],
    ["https://open-vsx.org/extension/foo/bar", "Open VSX"],
    ["https://crates.io/crates/serde", "crates.io"],
    ["https://rubygems.org/gems/rails", "RubyGems"],
    ["https://www.nuget.org/packages/Newtonsoft.Json", "NuGet"],
    ["https://hub.docker.com/r/library/node", "Docker Hub"],
    ["https://pub.dev/packages/http", "pub.dev"],
    ["https://pkg.go.dev/golang.org/x/net", "pkg.go.dev"],
    ["https://hex.pm/packages/phoenix", "hex.pm"],
    ["https://packagist.org/packages/laravel/laravel", "Packagist"],
    ["https://anaconda.org/conda-forge/numpy", "Anaconda"],
    ["https://mvnrepository.com/artifact/junit/junit", "Maven"],
    ["https://cocoapods.org/pods/Alamofire", "CocoaPods"],
    ["https://jsr.io/@std/path", "JSR"],
    ["https://plugins.jetbrains.com/plugin/123", "JetBrains Marketplace"],
    ["https://chromewebstore.google.com/detail/abc", "Chrome Web Store"],
    ["https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/", "Firefox Add-ons"],
    ["https://aur.archlinux.org/packages/yay", "AUR"],
    ["https://snapcraft.io/spotify", "Snap Store"],
    ["https://flathub.org/apps/org.gimp.GIMP", "Flathub"],
    ["https://search.nixos.org/packages?query=git", "NixOS"],
    ["https://formulae.brew.sh/formula/wget", "Homebrew"],
    ["https://ghcr.io/owner/image", "GitHub Container Registry"],
  ])("recognizes %s as %s", ([url, label]) => {
    const def = getLinkIcon(url);
    expect(def.label).toBe(label);
    expect(def.hoverClass).toMatch(/^hover:text-/);
    expect(def.icon).toBeTypeOf("function");
  });

  test("falls back to a generic link icon for unknown hosts", () => {
    expect(getLinkIcon("https://example.com/docs")).toMatchObject({ label: "Link", hoverClass: "hover:text-hi" });
  });

  test("BUG-03: matches on the URL host, not anywhere in the URL", () => {
    expect(getLinkIcon("https://github.com/someone/npmjs.com-mirror").label).toBe("Link");
  });

  test("BUG-03: does not match look-alike hosts", () => {
    expect(getLinkIcon("https://notpypi.org.evil.example/pkg").label).toBe("Link");
  });

  test("falls back for malformed URLs", () => {
    expect(getLinkIcon("not a url").label).toBe("Link");
  });
});
