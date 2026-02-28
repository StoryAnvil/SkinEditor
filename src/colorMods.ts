/*
  Copyright (C) 2025, StoryAnvil (https://github.com/StoryAnvil)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

function saveDiv(a: number, b: number) {
    if (a == 0) return 0;
    return b / a;
}

function hexIntoRGBA(hexCode: string): number[] {
    const res = [
        parseInt(hexCode.substring(0, 2), 16),
        parseInt(hexCode.substring(2, 4), 16),
        parseInt(hexCode.substring(4, 6), 16),
        255,
    ];
    if (hexCode.length == 8) {
        res[3] = parseInt(hexCode.substring(6, 8), 16);
    }
    return res;
}
function hexIntoFloatRGBA(hexCode: string): number[] {
    const res = [
        saveDiv(255, parseInt(hexCode.substring(0, 2), 16)),
        saveDiv(255, parseInt(hexCode.substring(2, 4), 16)),
        saveDiv(255, parseInt(hexCode.substring(4, 6), 16)),
        1,
    ];
    if (hexCode.length == 8) {
        res[3] = saveDiv(255, parseInt(hexCode.substring(6, 8), 16));
    }
    return res;
}
function RGBAToHex(r: number, g: number, b: number, a: number) {
    const red = r.toString(16).padStart(2, "0");
    const green = g.toString(16).padStart(2, "0");
    const blue = b.toString(16).padStart(2, "0");
    const alpha = a.toString(16).padStart(2, "0");
    if (alpha == "ff") return `${red}${green}${blue}`;
    return `${red}${green}${blue}${alpha}`;
}
function floatRGBAToHex(r: number, g: number, b: number, a: number) {
    return RGBAToHex(
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        Math.round(a * 255),
    );
}

export interface StColorMod {
    process(color: string): string;
}

export class StNOPColorMod implements StColorMod {
    process(color: string): string {
        return color;
    }
}

export class StTintColorMod implements StColorMod {
    #tint: number[];
    constructor(tintColor: string) {
        this.#tint = hexIntoFloatRGBA(tintColor);
    }
    process(color: string): string {
        let rgba = hexIntoFloatRGBA(color);
        return floatRGBAToHex(
            rgba[0] * this.#tint[0],
            rgba[1] * this.#tint[1],
            rgba[2] * this.#tint[2],
            rgba[3],
        );
    }
}
