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
export class StMenuBar {
    domElement: HTMLDivElement;

    constructor() {
        this.domElement = document.createElement("div");
        this.domElement.classList.add("menuBar");
    }

    createMenu(name: string): StMenu {
        return new StMenu(this, name);
    }
}

export class StMenu {
    domButtonElement: HTMLButtonElement;
    domElement: HTMLDivElement;
    subMenu: boolean;
    #children: StMenu[] = [];

    constructor(parent: StMenuBar | StMenu, name: string) {
        this.subMenu = parent instanceof StMenu;
        this.domButtonElement = document.createElement("button");
        this.domButtonElement.classList.add("menuBarBtn");
        if (this.subMenu) {
            this.domButtonElement.classList.add("menuBarSectionBtn");
        }
        this.domButtonElement.innerText = name;
        this.domButtonElement.onmouseenter = (e) => this.#open();
        this.domButtonElement.onmouseleave = (e) => this.#close();
        parent.domElement.appendChild(this.domButtonElement);

        this.domElement = document.createElement("div");
        this.domElement.classList.add("menuBarMenu");
        this.domElement.style.display = "none";
        this.domButtonElement.appendChild(this.domElement);
    }

    #open() {
        let {top, right, bottom, left} =
            this.domButtonElement.getBoundingClientRect();
        //left += window.screenX;
        //top += window.screenY;
        if (this.subMenu) {
            this.domElement.style.top = top + "px";
            this.domElement.style.left = right + "px";
        } else {
            this.domElement.style.top = bottom + "px";
            this.domElement.style.left = left + "px";
        }
        this.domElement.style.display = "flex";
    }

    #close() {
        this.domElement.style.display = "none";
        for (const sub of this.#children) {
            sub.#close();
        }
    }

    #addOption(name: string): HTMLButtonElement {
        const btn: HTMLButtonElement = document.createElement("button");
        btn.classList.add("menuBarBtn");
        btn.innerText = name;
        this.domElement.appendChild(btn);
        return btn;
    }

    addOption(name: string, action: () => void): StMenu {
        this.#addOption(name).onclick = () => {
            action();
            this.#close();
        };
        return this;
    }

    addLink(name: string, link: string): StMenu {
        this.#addOption(name).onclick = () => {
            open(link);
            this.#close();
        };
        return this;
    }

    addSeparator(): StMenu {
        const separator: HTMLElement = document.createElement("hr");
        separator.classList.add("menuBarSep");
        this.domElement.appendChild(separator);
        return this;
    }

    createMenu(name: string): StMenu {
        const menu = new StMenu(this, name);
        this.#children.push(menu);
        return menu;
    }
}
