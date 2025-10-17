type Luminosity = "any" | "bright" | "dark" | "pastel";

const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

function hslToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    const toHex = (x: number) =>
        Math.round(x * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function randomHexColor(luminosity: Luminosity = "any"): string {
    const h = rand(0, 359);
    let s: number, l: number;

    switch (luminosity) {
        case "bright":
            s = rand(70, 100);
            l = rand(45, 65);
            break;
        case "dark":
            s = rand(50, 90);
            l = rand(20, 40);
            break;
        case "pastel":
            s = rand(40, 70);
            l = rand(70, 85);
            break;
        default:
            s = rand(40, 100);
            l = rand(30, 80);
            break;
    }

    return hslToHex(h, s, l);
}