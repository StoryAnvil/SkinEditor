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

import {loadAction, loadActionArray, StAction} from "./accessoryActions";
import {loadInput, StAccessoryInput} from "./accessoryInputs";

function hexIntoData(hexCode: string, data: ImageData) {
    data.data[0] = parseInt(hexCode.substring(0, 2), 16);
    data.data[1] = parseInt(hexCode.substring(2, 4), 16);
    data.data[2] = parseInt(hexCode.substring(4, 6), 16);
    if (hexCode.length == 8) {
        data.data[3] = parseInt(hexCode.substring(6, 8), 16);
    } else {
        data.data[3] = 255;
    }
}

export type Str2<T> = {
    [key: string]: T;
};
export type SkinSet = {
    slim: string;
    classic: string;
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

    enabledNow: boolean = false;
    offsetNow: number = 0;

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
        if (!this.enabledNow) return;
        for (const color of Object.keys(this.buffer.pixels)) {
            if (color.length == 6) {
                canvas.fillStyle = "#" + color;

                for (const bufPos of this.buffer.pixels[color]) {
                    let pos = bufPos + this.offsetNow;
                    canvas.fillRect(pos % 100, Math.floor(pos / 100), 1, 1);
                }
            } else {
                hexIntoData(color, imageData);
                for (const bufPos of this.buffer.pixels[color]) {
                    let pos = bufPos + this.offsetNow;
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
    #inputs: Str2<StAccessoryInput> = {};
    #actions: StAction[] = [];
    assignedId: string = "";
    inputValues: Str2<any> = {};

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

        if (json.inputs) {
            for (const inputID of Object.keys(json.inputs)) {
                this.#inputs[inputID] = loadInput(json.inputs[inputID], this);
            }
        }

        if (json.actions) {
            this.#actions = loadActionArray(json.actions, this);
        }
    }

    createCfgPanel(panel: HTMLDivElement, builder: StOutfitBuilder) {
        const name = document.createElement("h4");
        name.innerText = this.#name;
        panel.appendChild(name);
        if (this.#author != "") {
            const author = document.createElement("p");
            author.classList.add("authorLabel");
            author.innerText = "By " + this.#author;
            panel.appendChild(author);
        }
        panel.appendChild(document.createElement("hr"));

        for (const inputID of Object.keys(this.#inputs)) {
            this.#inputs[inputID].createCfgPanel(panel, builder, this);
        }
    }

    render(canvas: CanvasRenderingContext2D, builder: StOutfitBuilder) {
        this.inputValues = {};

        for (const inputID of Object.keys(this.#inputs)) {
            this.inputValues[inputID] = this.#inputs[inputID].getValue(
                builder,
                this,
            );
        }
        for (const layerID of Object.keys(this.#layers)) {
            const layer = this.#layers[layerID];
            layer.enabledNow = layer.enabledByDefault;
            layer.offsetNow = layer.offset;
        }
        console.log(this.inputValues);
        for (const action of this.#actions) {
            action.apply(builder, this, this.#layers);
        }

        const imageData = canvas.createImageData(1, 1);
        for (const layerID of Object.keys(this.#layers)) {
            this.#layers[layerID].render(canvas, imageData);
        }
    }
}

export const BaseTextures: Str2<SkinSet> = {
    cog: {
        slim: require("./bases/cog-slim.png"),
        classic: require("./bases/cog-classic.png"),
    },
};
Object.freeze(BaseTextures);

async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = document.createElement("img");
        img.addEventListener("load", () => {
            resolve(img);
        });
        img.src = url;
    });
}

export class StOutfitBuilder {
    // Class for mixing multiple accessories on same skin safely

    // Added accessories
    #accessories: StLoadedAccessory[] = [];
    #accessoryIds: Set<string> = new Set();

    // True if skin should be slim
    #isSlim: boolean = false;

    // Base texture of the skin
    #baseTexture: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
    #baseTextureName: string = null;

    // Method to call when skin changes
    renderTarget: () => void;

    // Method to call when skin 3d model changes
    hardRerenderTarget: () => void;

    // Canvas to render skin into. Read-only!
    resultCanvas: HTMLCanvasElement;
    #canvas: CanvasRenderingContext2D;

    constructor(
        baseTexture:
            | HTMLImageElement
            | HTMLCanvasElement
            | ImageBitmap
            | string,
        renderTarget: () => void,
        hardRerenderTarget: () => void,
    ) {
        this.resultCanvas = document.createElement("canvas");
        this.resultCanvas.width = 64;
        this.resultCanvas.height = 64;
        this.renderTarget = renderTarget;
        this.hardRerenderTarget = hardRerenderTarget;
        this.#canvas = this.resultCanvas.getContext("2d");

        this.setBaseTexture(baseTexture).then(() => {
            this.#fullRerender();
        });
    }

    onConfigChange() {
        // Call when accessory config changes
        this.#fullRerender();
    }

    #fullRerender() {
        this.#canvas.clearRect(
            0,
            0,
            this.resultCanvas.width,
            this.resultCanvas.height,
        );
        this.#canvas.drawImage(this.#baseTexture, 0, 0);

        for (const accesory of this.#accessories) {
            accesory.render(this.#canvas, this);
        }

        this.renderTarget();
    }

    async setBaseTexture(
        value: HTMLImageElement | HTMLCanvasElement | ImageBitmap | string,
    ) {
        // Sets base texture of the skin
        return new Promise(async (resolve, reject) => {
            if (typeof value === "string") {
                this.#baseTexture = await loadImage(
                    BaseTextures[value][this.#isSlim ? "slim" : "classic"],
                );
                this.#baseTextureName = value;
            } else {
                this.#baseTexture = value;
                this.#baseTextureName = null;
            }
            this.#fullRerender();
            this.hardRerenderTarget();

            resolve(null);
        });
    }

    get isSlim() {
        return this.#isSlim;
    }

    set isSlim(value: boolean) {
        this.#isSlim = value;
        if (this.#baseTextureName != null) {
            this.setBaseTexture(this.#baseTextureName).then(() => {
                this.#fullRerender();
                this.hardRerenderTarget();
                this.renderTarget();
            });
        }
    }

    async toggleAccessory(id: string, configPanel: HTMLDivElement) {
        // Adds accessory if it isn't added.
        // If it is added already, removes it.

        if (this.#accessoryIds.has(id)) {
            await this.removeAccessory(id, configPanel);
        } else {
            await this.addAccessory(id, configPanel);
        }
    }

    async removeAccessory(id: string, configPanel: HTMLDivElement) {
        // Removes accessory by id
        this.#accessoryIds.delete(id);
        for (let i = 0; i < this.#accessories.length; i++) {
            const element = this.#accessories[i];
            if (element.assignedId == id) {
                i--;
                this.#accessories.splice(i, 1);
                break;
            }
        }
        console.log("Removed " + id);
        configPanel.replaceChildren();
        this.#fullRerender();
    }

    async addAccessory(id: string, configPanel: HTMLDivElement) {
        // Adds accesory by id
        this.#accessoryIds.add(id);
        const accesory: StLoadedAccessory = await this.loadExternalAccessory(
            `./src/accessories/${id}.json`,
        );
        accesory.assignedId = id;
        this.#accessories.push(accesory);
        accesory.createCfgPanel(configPanel, this);
        this.#fullRerender();
    }

    #setupConfigPanel(
        accesory: StLoadedAccessory,
        configPanel: HTMLDivElement,
    ) {}

    async loadExternalAccessory(url: string): Promise<StLoadedAccessory> {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((resp) => resp.json())
                .then((json) => resolve(new StLoadedAccessory(json)))
                .catch(reject);
        });
    }
}
