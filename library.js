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
export const library = {
  all: [
    "cat",
    "pants",
    "santa",
    "cool_glasses",
    "gloves",
    "boots",
    "blank_shirt",
    "sneakers",
    "unnamed",
    "watch",
    "metal_arm",
    "eye2_2",
    "eye4_2",
    //"modern_eyeglasses"
  ],
  base: [
    ["load_skin", "Load your minecraft skin"],
    ["female_0", "slim"],
    ["male_0", "wide"],
  ],
  cat: {
    name: "Cat Ears",
    category: "Head",
    support: "wide",
    variants: [],
    recolor: [
      ["255", "255", "255"],
      ["245", "200", "214"],
    ],
    author: "BloodRain121",
  },
  pants: {
    name: "Pants",
    category: "Pants",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  santa: {
    name: "Santa Hat",
    category: "Head",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  cool_glasses: {
    name: "Cool Glasses",
    category: "Head",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  gloves: {
    name: "Gloves",
    category: "Hands",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  boots: {
    name: "Boots",
    category: "Feet",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  blank_shirt: {
    name: "Blank T-Shirt",
    category: "Body",
    support: "wide",
    variants: ["", "_red", "_green", "_blue"],
    author: "BloodRain121",
  },
  sneakers: {
    name: "Sneakers",
    category: "Feet",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  unnamed: {
    name: "Unnamed",
    category: "Body",
    support: "wide",
    variants: ["", "_pink"],
    author: "BloodRain121",
  },
  watch: {
    name: "Watch",
    category: "Hands",
    support: "wide",
    variants: [],
    author: "BloodRain121",
  },
  metal_arm: {
    name: "Metal Arm",
    category: "Hands",
    support: "wide",
    variants: ["", "_copper"],
    author: "BloodRain121",
  },
  eye2_2: {
    name: "2-Pixel eyes +2",
    category: "Eyes",
    support: "wide",
    variants: [],
    recolor: [
      ["255", "255", "255"], ["0", "0", "0"],
    ],
    offset: ["-Y", 0, 2],
    author: "DenisJava",
  },
  eye4_2: {
    name: "4-Pixel eyes +2",
    category: "Eyes",
    support: "wide",
    variants: [],
    recolor: [
      ["255", "255", "255"], ["0", "0", "0"],
    ],
    offset: ["-Y", 0, 2],
    author: "DenisJava",
  },
  modern_eyeglasses: {
    name: "Modern eyeglasses",
    category: "Head",
    suppor: "wide",
    variants: [],
    offset: ["-Y", 0, 2],
    recolor: [
      ["10", "203", "219"]
    ],
    author: "DenisJava"
  }
};
