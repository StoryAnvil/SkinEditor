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

import {StLoadedAccessory, StOutfitBuilder, Str2} from "./accessory";

type StCatalogMap = {
    hat: StCatalogEntry[];
    face: StCatalogEntry[];
    hair: StCatalogEntry[];
    body: StCatalogEntry[];
    arms: StCatalogEntry[];
    legs: StCatalogEntry[];
    feet: StCatalogEntry[];
};

class StCatalogEntry {
    image: string;
    id: string;

    constructor(id: string, image: string, dump: any) {
        this.id = id;
        this.image = image;
    }
}

const catalogMap: StCatalogMap & Str2<StCatalogEntry[]> = {
    hat: [
        new StCatalogEntry(
            "cat",
            require("./accessories/cat.png"),
            require("./accessories/cat.json"),
        ),
    ],
    face: [],
    hair: [],
    body: [],
    arms: [],
    legs: [],
    feet: [],
};

export class StCatalog {
    domElement: HTMLDivElement;
    #sections: Str2<HTMLDivElement> = {};
    #sectionsRoot: HTMLDivElement;
    #entries: StCatalogEntry[] = [];
    #builder: StOutfitBuilder;

    constructor(outfitBuilder: StOutfitBuilder) {
        this.#builder = outfitBuilder;

        this.domElement = document.createElement("div");
        this.domElement.classList.add("catalogRoot");

        this.#sectionsRoot = document.createElement("div");
        this.#sectionsRoot.classList.add("catalogSectionsRoot");
        this.domElement.appendChild(this.#sectionsRoot);

        const createEntryRoot = (name: string, displayName: string) => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("catalogSectionWrapper");

            const root = document.createElement("div");
            root.classList.add("catalogSection");

            const header = document.createElement("h3");
            header.innerText = displayName;

            wrapper.appendChild(header);
            wrapper.appendChild(root);
            this.#sectionsRoot.appendChild(wrapper);
            this.#sections[name] = root;
            return wrapper;
        };

        createEntryRoot("bases", "Skin base");
        createEntryRoot("hair", "Hair");
        createEntryRoot("hat", "Hat");
        createEntryRoot("face", "Face");
        createEntryRoot("body", "Body");
        createEntryRoot("arms", "Arms");
        createEntryRoot("legs", "Legs");
        createEntryRoot("feet", "Feet");

        for (const section of Object.keys(catalogMap)) {
            for (const entry of catalogMap[section]) {
                this.addEntry(entry, section);
            }
        }

        const customSkinInput = document.createElement("input");
        customSkinInput.style.position = "absolute";
        customSkinInput.style.top = "0px";
        customSkinInput.style.bottom = "0px";
        customSkinInput.style.left = "0px";
        customSkinInput.style.right = "0px";
        customSkinInput.style.opacity = "0";
        customSkinInput.type = "file";
        customSkinInput.accept = ".png";
        customSkinInput.onchange = () => {
            if (customSkinInput.files.length !== 1) return;
            const img = document.createElement("img");
            img.width = 64;
            img.height = 64;
            img.addEventListener("load", async () => {
                const typelessWindow: any = window;
                const builder: StOutfitBuilder = typelessWindow._outfitBuilder;
                await builder.setBaseTexture(img);
                typelessWindow._lastIMG = img;
            });
            img.src = URL.createObjectURL(customSkinInput.files[0]);
        };

        // prettier-ignore
        const customSkinRoot = this.addSkinBaseEntry(null, require("./bases/custom.png"),);
        customSkinRoot.appendChild(customSkinInput);
        customSkinRoot.style.position = "relative";

        this.addSkinBaseEntry("#cog", require("./bases/cog.png"));
    }

    addSkinBaseEntry(
        supplier: string | (() => Promise<string>) | null,
        imageSrc: string,
    ) {
        const root = document.createElement("div");
        root.classList.add("catalogEntry");
        const entryID = this.#entries.length;
        root.setAttribute("data-entry", entryID + "");

        const image = document.createElement("img");
        image.classList.add("catalogEntryPreview");
        image.src = imageSrc;
        root.appendChild(image);

        if (supplier == null) {
        } else if (typeof supplier === "string") {
            let sup: string = supplier;
            if (supplier.startsWith("#")) {
                sup = supplier.substring(1);
                root.onclick = () => {
                    const typelessWindow: any = window;
                    const builder: StOutfitBuilder =
                        typelessWindow._outfitBuilder;
                    builder.setBaseTexture(sup);
                };
            } else {
                root.onclick = async () => {
                    const img = document.createElement("img");
                    img.src = sup;
                    await new Promise((resolve, reject) => {
                        img.addEventListener("load", resolve);
                    });
                    const typelessWindow: any = window;
                    const builder: StOutfitBuilder =
                        typelessWindow._outfitBuilder;
                    builder.setBaseTexture(img);
                };
            }
        } else {
            const sup: () => Promise<string> = supplier;
            root.onclick = async () => {
                const img = document.createElement("img");
                img.src = await sup();
                await new Promise((resolve, reject) => {
                    img.addEventListener("load", resolve);
                });
                const typelessWindow: any = window;
                const builder: StOutfitBuilder = typelessWindow._outfitBuilder;
                builder.setBaseTexture(img);
            };
        }

        this.#sections["bases"].appendChild(root);
        return root;
    }

    addEntry(entry: StCatalogEntry, section: string) {
        const root = document.createElement("div");
        root.classList.add("catalogEntry");
        const entryID = this.#entries.length;
        root.setAttribute("data-entry", entryID + "");
        this.#entries.push(entry);

        const image = document.createElement("img");
        image.classList.add("catalogEntryPreview");
        image.src = entry.image;
        root.appendChild(image);
        this.#entries.push(entry);

        const cfg = document.createElement("img");
        cfg.classList.add("catalogEntryCfg");
        cfg.src = require("./config.svg");
        root.appendChild(cfg);

        const config = document.createElement("div");
        config.classList.add("catalogEntryCfgPanel");
        config.style.display = "none";
        root.appendChild(config);

        image.onclick = async () => {
            await this.#builder.toggleAccessory(entry.id, config);
        };
        cfg.onclick = () => {
            if (config.style.display == "none") {
                let {top, right, bottom, left} = root.getBoundingClientRect();
                //left += window.screenX;
                //top += window.screenY;
                config.style.top = top + "px";
                config.style.left = right + "px";
                config.style.display = "flex";
            } else {
                config.style.display = "none";
            }
        };
        root.onmouseleave = () => {
            config.style.display = "none";
        };

        this.#sections[section].appendChild(root);
    }
}
