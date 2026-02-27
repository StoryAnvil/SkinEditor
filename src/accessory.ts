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

function hexIntoData(hexCode: string, data: ImageData) {
    data.data[0] = parseInt(hexCode.substring(1, 3), 16);
    data.data[1] = parseInt(hexCode.substring(3, 5), 16);
    data.data[2] = parseInt(hexCode.substring(5, 7), 16);
    data.data[3] = parseInt(hexCode.substring(7, 9), 16);
}

export type Str2<T> = {
    [key: string]: T;
};

export class StPixelBuffer {
    #pixels: Str2<number[]>;

    constructor(json: any) {
        /**
         * Loads pixel buffer from JSON
         */

        this.#pixels = json.px;
    }

    get pixels(): Str2<number[]> {
        return this.#pixels;
    }
}

export class StLayer {
    buffer: StPixelBuffer;
    offset: number = 0;
    enabledByDefault: boolean = false;

    constructor(json: any, buffers: Str2<StPixelBuffer>) {
        /**
         * Loads layer from JSON
         */

        this.buffer = buffers[json.buffer];

        if (json.offset) {
            this.offset = json.offset[1] * 100 + json.offset[0];
        }

        if (json.enabledByDefault == true) {
            this.enabledByDefault = true;
        }
    }

    render(canvas: CanvasRenderingContext2D, imageData: ImageData) {
        for (const color of Object.keys(this.buffer.pixels)) {
            if (color.length == 6) {
                canvas.fillStyle = "#" + color;

                for (const bufPos of this.buffer.pixels[color]) {
                    let pos = bufPos + this.offset;
                    canvas.fillRect(pos % 100, Math.floor(pos / 100), 1, 1);
                }
            } else {
                hexIntoData(color, imageData);
                for (const bufPos of this.buffer.pixels[color]) {
                    let pos = bufPos + this.offset;
                    canvas.putImageData(
                        imageData,
                        pos % 100,
                        Math.floor(pos / 100),
                    );
                }
            }
        }
    }
}

export class StLoadedAccessory {
    // Represents single accessory

    #name: string;
    #author: string;
    #catergory: string;
    #tags: Set<string>;
    #buffers: Str2<StPixelBuffer> = {};
    #layers: Str2<StLayer> = {};

    constructor(json: any) {
        /**
         * Loads accessory from JSON.
         * supplied JSON must comply with
         * ./schema/stAccessory.json json schema
         */

        const {meta, layers, buffers} = json;

        this.#name = meta.name;
        this.#author = meta.author;
        this.#catergory = meta.category;
        this.#tags = new Set(meta.tags);

        for (const bufferID of Object.keys(buffers)) {
            this.#buffers[bufferID] = new StPixelBuffer(buffers[bufferID]);
        }

        for (const layerID of Object.keys(layers)) {
            this.#layers[layerID] = new StLayer(layers[layerID], this.#buffers);
        }
    }

    render(canvas: CanvasRenderingContext2D) {
        const imageData = canvas.createImageData(1, 1);
        for (const layerID of Object.keys(this.#layers)) {
            this.#layers[layerID].render(canvas, imageData);
        }
    }
}
