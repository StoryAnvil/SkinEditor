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
import {StLoadedAccessory, StOutfitBuilder} from "./accessory";
import {LiteralValue, loadValue, StValue} from "./accessoryActions";

export function loadInput(
    json: any,
    accesory: StLoadedAccessory,
): StAccessoryInput {
    const type: string = json.type;

    if (type === "isSlim") {
        return new IsSlimInput();
    }
    if (type === "intrange") {
        return new IntRangeInput(json);
    }
    if (type === "color") {
        return new ColorInput(json, accesory);
    }
    if (type === "constant" || type === "const") {
        return new ConstantInput(json, accesory);
    }
    if (type === "choice") {
        return new ChoiceInput(json, accesory);
    }
    return null;
}
export interface StAccessoryInput {
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void;
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory): any;
}

function simpleLabel(name: string) {
    const label = document.createElement("p");
    label.classList.add("catalogEntryCfgLabel");
    label.innerText = name;
    return label;
}

class IsSlimInput implements StAccessoryInput {
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void {
        // NOP. IsSlimInput should not have any visible indication.
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return builder.isSlim;
    }
}

class ColorInput implements StAccessoryInput {
    #name: string;
    #defaultValue;
    #input: HTMLInputElement;
    #alpha: StValue;
    constructor(json: any, accessory: StLoadedAccessory) {
        this.#name = json.name;
        this.#defaultValue = json.default;

        if (json.alpha) {
            this.#alpha = loadValue(json.alpha, accessory);
        } else {
            this.#alpha = new LiteralValue(255);
        }

        this.#input = document.createElement("input");
        this.#input.type = "color";
        this.#input.value = "#" + this.#defaultValue;

        // Use setAttribute because colorspace is experemental
        this.#input.setAttribute("colorspace", "display-p3");
    }
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void {
        panel.appendChild(simpleLabel(this.#name));
        panel.appendChild(this.#input);
        this.#input.onchange = () => builder.onConfigChange(accesory);
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        let val = this.#input.value;
        if (val.startsWith("#")) {
            val = val.substring(1);
        }
        const alpha = this.#alpha.getValue(builder, accesory).toString(16);
        return (val.substring(0, 6) + alpha).toUpperCase();
    }
}

class IntRangeInput implements StAccessoryInput {
    #range: HTMLInputElement;
    #name: string;
    constructor(json: any) {
        this.#range = document.createElement("input");
        this.#range.type = "range";
        this.#range.min = json.minimum;
        this.#range.max = json.maximum;
        this.#name = json.name;

        if (json.default) {
            this.#range.value = json.default;
        } else {
            this.#range.value = this.#range.min;
        }
    }
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void {
        this.#range.oninput = () => builder.onConfigChange(accesory);
        panel.appendChild(simpleLabel(this.#name));
        panel.appendChild(this.#range);
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return this.#range.value;
    }
}

class ConstantInput implements StAccessoryInput {
    #value: StValue;

    constructor(json: any, accessory: StLoadedAccessory) {
        this.#value = loadValue(json.value, accessory);
    }
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void {
        // NOP. Contant inputs do not need any visible indication.
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return this.#value.getValue(builder, accesory);
    }
}

class ChoiceInput implements StAccessoryInput {
    #choices: string[];
    #active: number;
    #domElement: HTMLDivElement;
    #name: string;
    #event: () => void;

    constructor(json: any, accessory: StLoadedAccessory) {
        this.#name = json.name;
        this.#choices = json.choices;
        if (json.default) {
            this.#active = json.default;
        } else {
            this.#active = 0;
        }

        this.#domElement = document.createElement("div");
        this.#domElement.classList.add("choicesRoot");
        const radioGroup =
            "acccfg" +
            accessory.assignedId +
            Math.floor(Math.random() * 100000);
        const elements: HTMLInputElement[] = [];
        for (let i = 0; i < this.#choices.length; i++) {
            const choice = this.#choices[i];

            const root = document.createElement("div");
            root.classList.add("choice");

            const input = document.createElement("input");
            input.type = "radio";
            input.name = radioGroup;
            const finalI = i;
            input.onchange = () => {
                this.#active = finalI;
                this.#event();
            };
            root.appendChild(input);

            const label = document.createElement("span");
            label.innerText = choice;
            root.appendChild(label);

            elements.push(input);

            this.#domElement.appendChild(root);
        }
        elements[this.#active].click();
    }
    createCfgPanel(
        panel: HTMLDivElement,
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
    ): void {
        panel.appendChild(simpleLabel(this.#name));
        panel.appendChild(this.#domElement);
        this.#event = () => {
            builder.onConfigChange(accesory);
        };
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return this.#choices[this.#active];
    }
}
