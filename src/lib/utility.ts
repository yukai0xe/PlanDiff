export function parseEnumKey<T extends Record<string, string | number>>(
    enumObj: T,
    value: string | number
): keyof T {
    const key = (Object.entries(enumObj) as [keyof T, string | number][]).find(
        ([, val]) => val === value
    )?.[0];
    if (!key) {
        throw new Error(`Value ${value} not found in enum`);
    }
    return key;
}

export function calculateDuration(startDate: string | Date, endDate: string | Date): number {
    return Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function uuidToNumericId(): string {
    const uuid = crypto.randomUUID();
    let numeric = '';
    for (const char of uuid.replace(/-/g, '')) {
        numeric += char.charCodeAt(0) % 10;
    }
    return numeric.slice(0, 16);
}

export function numberToChinese(num: number): string {
    const units = ["", "十", "百", "千", "萬", "億"]
    const chars = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]

    if (num === 0) return "零"

    let str = ""
    let unitPos = 0
    let zero = true

    while (num > 0) {
        const section = num % 10
        if (section === 0) {
            if (!zero) {
                zero = true
                str = chars[0] + str
            }
        } else {
            zero = false
            str = chars[section] + units[unitPos] + str
        }
        unitPos++
        num = Math.floor(num / 10)
    }

    if (str.startsWith("一十")) {
        str = str.substring(1)
    }

    return str
}

export function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToTime(m: number): string {
    const hours = Math.floor(m / 60) % 24;
    const minutes = m % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}