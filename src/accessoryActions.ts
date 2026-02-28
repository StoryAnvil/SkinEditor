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

import {StLayer, StLoadedAccessory, StOutfitBuilder, Str2} from "./accessory";

//#region Values
export function loadValue(json: any, accesory: StLoadedAccessory): StValue {
    if (typeof json !== "object") {
        return new LiteralValue(json);
    }

    const type: string = json.type;

    if (type === "input") {
        return new InputValue(json);
    }
    return null;
}

export interface StValue {
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory): any;
}

export class LiteralValue implements StValue {
    #value: any;
    constructor(value: any) {
        this.#value = value;
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return this.#value;
    }
}

class InputValue implements StValue {
    #input: string;
    constructor(json: any) {
        this.#input = json.input;
    }
    getValue(builder: StOutfitBuilder, accesory: StLoadedAccessory) {
        return accesory.inputValues[this.#input];
    }
}
//#endregion

//#region Actions
export function loadActionArray(
    json: any,
    accesory: StLoadedAccessory,
): StAction[] {
    const actions: StAction[] = [];
    for (const act of json) {
        actions.push(loadAction(act, accesory));
    }
    return actions;
}
export function loadAction(json: any, accesory: StLoadedAccessory): StAction {
    const type: string = json.type;

    if (type === "setlayer") {
        return new SetLayersAction(json);
    }
    if (type === "addoffset") {
        return new AddOffsetAction(json, accesory);
    }
    if (type === "settint") {
        return new SetTintAction(json, accesory);
    }
    if (type === "if") {
        return new ExecuteIfAction(json, accesory);
    }
    return null;
}

export interface StAction {
    apply(
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
        layers: Str2<StLayer>,
    ): void;
}

class SetLayersAction implements StAction {
    #enable: string[] = [];
    #disable: string[] = [];
    constructor(json: any) {
        if (json.enable) {
            this.#enable = json.enable;
        }
        if (json.disable) {
            this.#disable = json.enable;
        }
    }
    apply(
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
        layers: Str2<StLayer>,
    ): void {
        for (const layer of this.#enable) {
            layers[layer].enabledNow = true;
        }
        for (const layer of this.#disable) {
            layers[layer].enabledNow = false;
        }
    }
}

class AddOffsetAction implements StAction {
    #layers: string[];
    #xOffset: StValue = new LiteralValue(0);
    #yOffset: StValue = new LiteralValue(0);

    constructor(json: any, accessory: StLoadedAccessory) {
        this.#layers = json.layers;

        if (json.x_offset) {
            this.#xOffset = loadValue(json.x_offset, accessory);
        }
        if (json.y_offset) {
            this.#yOffset = loadValue(json.y_offset, accessory);
        }
    }
    apply(
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
        layers: Str2<StLayer>,
    ): void {
        const offset =
            this.#yOffset.getValue(builder, accesory) * 100 +
            this.#xOffset.getValue(builder, accesory);
        for (const layer of this.#layers) {
            layers[layer].offsetNow += offset;
        }
    }
}
class SetTintAction implements StAction {
    #layers: string[];
    #tint: StValue;

    constructor(json: any, accessory: StLoadedAccessory) {
        this.#layers = json.layers;
        this.#tint = loadValue(json.tint, accessory);
    }
    apply(
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
        layers: Str2<StLayer>,
    ): void {
        const value = this.#tint.getValue(builder, accesory);
        for (const layer of this.#layers) {
            layers[layer].tintNow = value;
        }
    }
}

class ExecuteIfAction implements StAction {
    #actions: StAction[];
    #valueA: StValue;
    #valueB: StValue;
    #operator: string;

    constructor(json: any, accessory: StLoadedAccessory) {
        this.#actions = loadActionArray(json.actions, accessory);
        this.#valueA = loadValue(json.condition[0], accessory);
        this.#valueB = loadValue(json.condition[2], accessory);
        this.#operator = json.condition[1];
    }
    apply(
        builder: StOutfitBuilder,
        accesory: StLoadedAccessory,
        layers: Str2<StLayer>,
    ): void {
        const a = this.#valueA.getValue(builder, accesory);
        const b = this.#valueB.getValue(builder, accesory);
        let result = false;

        if (this.#operator === "==") {
            result = a == b;
        } else if (this.#operator === "!=") {
            result = a != b;
        } else if (this.#operator === "!=") {
            result = a != b;
        } else if (this.#operator === ">") {
            result = a > b;
        } else if (this.#operator === "<") {
            result = a < b;
        } else if (this.#operator === ">=") {
            result = a >= b;
        } else if (this.#operator === "<=") {
            result = a <= b;
        }

        if (result) {
            for (const action of this.#actions) {
                action.apply(builder, accesory, layers);
            }
        }
    }
}
//#endregion
