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
import {StLayer, StPixelBuffer} from "./accessory";

function rgbaToHex(r: number, g: number, b: number, a: number) {
    const red = r.toString(16).padStart(2, "0");
    const green = g.toString(16).padStart(2, "0");
    const blue = b.toString(16).padStart(2, "0");
    const alpha = a.toString(16).padStart(2, "0");
    if (alpha == "ff") return `${red}${green}${blue}`;
    return `${red}${green}${blue}${alpha}`;
}

export function openImageConverter(root: HTMLElement) {
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".png";
    left.appendChild(fileInput);

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    left.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const canvas2 = document.createElement("canvas");
    canvas2.width = 64;
    canvas2.height = 64;
    left.appendChild(canvas2);
    const ctx2 = canvas2.getContext("2d");

    const textArea = document.createElement("textarea");
    textArea.style.flexGrow = "1";

    root.replaceChildren(left, textArea);

    function onImageLoad(img: HTMLImageElement) {
        console.log("Image loaded!");
        ctx.clearRect(0, 0, 64, 64);
        ctx2.clearRect(0, 0, 64, 64);
        ctx.drawImage(img, 0, 0, 64, 64);
        console.log("Image drawn!");
        let px: any = {};
        for (let x = 0; x < 64; x++) {
            for (let y = 0; y < 64; y++) {
                const data = ctx.getImageData(x, y, 1, 1);
                if (data.data[3] == 0) {
                    continue;
                }
                const hex = rgbaToHex(
                    data.data[0],
                    data.data[1],
                    data.data[2],
                    data.data[3],
                ).toUpperCase();
                if (!px[hex]) {
                    px[hex] = [];
                }
                px[hex].push(y * 100 + x);
            }
        }
        console.log("Image parsed!");
        const resultBuffer = {
            px: px,
        };
        textArea.value = JSON.stringify(resultBuffer);
        console.log("Buffer ready!");
        const deserialized = new StPixelBuffer(resultBuffer);
        const layer = new StLayer({buffer: "l"}, {l: deserialized});
        layer.enabledNow = true;
        setTimeout(() => {
            layer.render(ctx2, ctx2.createImageData(1, 1));
            console.log("Following layer rendered:");
            console.log(layer);
        }, 150);
    }

    fileInput.onchange = async () => {
        if (fileInput.files.length !== 1) return;
        const img = document.createElement("img");
        img.width = 64;
        img.height = 64;
        left.replaceChildren(fileInput, canvas, img, canvas2);
        img.addEventListener("load", () => onImageLoad(img));
        img.src = URL.createObjectURL(fileInput.files[0]);
    };
}
