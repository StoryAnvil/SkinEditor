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
            require("./9f4420391882124f.png"),
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

        const createEntryRoot = (name: string) => {
            const root = document.createElement("div");
            root.classList.add("catalogSection");
            this.#sectionsRoot.appendChild(root);
            this.#sections[name] = root;
        };

        createEntryRoot("hat");
        createEntryRoot("face");
        createEntryRoot("hair");
        createEntryRoot("body");
        createEntryRoot("arms");
        createEntryRoot("legs");
        createEntryRoot("feet");

        for (const section of Object.keys(catalogMap)) {
            for (const entry of catalogMap[section]) {
                this.addEntry(entry, section);
            }
        }
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
