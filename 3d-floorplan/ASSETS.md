# Assets and licenses

All downloaded assets are stored locally in `public/assets`. The app needs no asset service at runtime. Poly Haven and font source pages and licenses were checked on 2026-10-07.

The downloaded furniture, HDRI, and floor maps use [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). [Poly Haven's asset license](https://polyhaven.com/license) confirms that its HDRIs, textures, and models use CC0 and may be modified and redistributed. Credits below are retained for provenance. The app does not call the Poly Haven API at runtime. Poly Haven's public API was used only to locate source downloads and their checksums during development.

## Built-in floor-plan reference

| Local file under `public/assets` | Source | Rights/provenance | Bytes | Dimensions and use |
| --- | --- | --- | ---: | --- |
| `floorplans/original-floor-plan.jpg` | [2. Orginal floor plan.jpg](https://drive.google.com/file/d/1LYIPNz-XkInoqshQzZYiG1N7lpeKNdxZ/view), supplied by the user | User-supplied source; no MIT or CC0 license asserted | 86,051 | 1125 × 1518 JPEG; built-in reference for the default 4 bedrooms layout |

The JPEG was downloaded on 2026-10-07 and preserved without editing, including its existing watermark. At the user's explicit request, it is stored as a regular project asset alongside the other application assets, rather than in `.private/`. The application makes no Google Drive request at runtime.

`src/seed/original-floor-plan.ts` contains the editable trace with layout ID `original-floor-plan`. The four-bedroom arrangement, openings, fixed fixtures and façade details are approximate. The image has no printed dimensions; the trace uses an estimated 65 pixels per metre and is not a measured survey. The source image ships alongside the editable trace as a project asset. Reloading restores the seed layout; manual edits remain in memory only.

## Local 3D asset inventory

| Local file under `public/assets` | Source and author | License | Bytes | Use |
| --- | --- | --- | ---: | --- |
| `models/modern-arm-chair.glb` | [Modern Arm Chair 01](https://polyhaven.com/a/modern_arm_chair_01), Vibrant Nordic | CC0 1.0 | 2,696,208 | Oak frame and dark leather lounge chair; 8,916 triangles, two PBR materials |
| `models/round-coffee-table.glb` | [Coffee Table Round 01](https://polyhaven.com/a/coffee_table_round_01), Ulan Cabanilla | CC0 1.0 | 1,562,152 | Round white stone top and metal loop legs; 4,044 triangles |
| `environment/brown-photostudio-02-1k.hdr` | [Brown Photostudio 02](https://polyhaven.com/a/brown_photostudio_02), Sergej Majboroda | CC0 1.0 | 1,648,130 | Indoor image-based light, 1024 x 512 Radiance RGBE |
| `textures/wood-floor-color.jpg` | [Wood Floor](https://polyhaven.com/a/wood_floor), Dimitrios Savva | CC0 1.0 | 734,493 | Oak-grain plank color, 1024 x 1024 |
| `textures/wood-floor-normal.jpg` | Same Wood Floor material and author | CC0 1.0 | 423,303 | OpenGL tangent normal, 1024 x 1024 |
| `textures/wood-floor-roughness.jpg` | Same Wood Floor material and author | CC0 1.0 | 527,754 | Roughness, 1024 x 1024 |

The six downloaded 3D runtime assets total **7,592,040 bytes, 7.59 MB or 7.24 MiB**. This is below the 40 MB budget. The two GLBs contain nine 1024 x 1024 JPEG maps in total. No Draco, Meshopt, or remote decoder is required.

## Processing and placement

Poly Haven provides the selected models as glTF plus geometry buffers and JPEG maps. These were repacked into self-contained GLB 2.0 files. Geometry and image bytes were preserved; only container references and alignment padding changed. Every downloaded source file matched the byte count and MD5 published in its Poly Haven download manifest. All map dimensions were checked with `sips`. The HDRI and floor maps were copied without modification.

The original model dimensions and origins are below. Units are metres, Y is up. The renderer centers the model in X/Z and lifts its minimum Y to the floor before scaling it to its catalog footprint. Source materials remain intact.

| Model | Width X | Height Y | Depth Z | Original minimum XYZ | Original maximum XYZ |
| --- | ---: | ---: | ---: | --- | --- |
| Armchair | 0.820344 | 1.022852 | 0.986562 | -0.406809, 0.000382, -0.575452 | 0.413536, 1.023234, 0.411110 |
| Coffee table | 1.301301 | 0.491009 | 1.301302 | -0.650651, -0.001377, -0.650651 | 0.650650, 0.489632, 0.650651 |

Wood Floor represents approximately 1.7 m of floor width per source tile. The base-color map uses sRGB; normal and roughness maps use linear data. Repetition and restrained material color tinting adapt the source to the apartment.

Other furniture, cabinetry, fixtures, plants and textiles are original geometry authored for this project and exported to local GLBs. The original geometry and drawings use the repository MIT license. Rounded edges and shared materials keep these additions consistent with the downloaded furniture. Architecture and thumbnails remain procedural. No Pascal source code, models, or `@pascal-app/*` packages were copied. No Kenney assets were needed.

The two Poly Haven models supply the detailed hero furniture. The sofa uses original authored geometry exported to GLB because the available Poly Haven sofa candidates have carved Victorian frames that did not fit the requested warm minimalist apartment.

## Exact downloads

The following Poly Haven manifests describe every source download, including the embedded model maps and geometry buffers:

- [Modern Arm Chair 01 source manifest](https://api.polyhaven.com/files/modern_arm_chair_01), `gltf.1k.gltf` and its `include` entries.
- [Coffee Table Round 01 source manifest](https://api.polyhaven.com/files/coffee_table_round_01), `gltf.1k.gltf` and its `include` entries.
- [Brown Photostudio 02 source manifest](https://api.polyhaven.com/files/brown_photostudio_02), `hdri.1k.hdr`.
- [Wood Floor source manifest](https://api.polyhaven.com/files/wood_floor), `Diffuse.1k.jpg`, `nor_gl.1k.jpg`, and `Rough.1k.jpg`.

Direct source files used for the runtime assets:

- [modern_arm_chair_01_1k.gltf](https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/modern_arm_chair_01/modern_arm_chair_01_1k.gltf), 5121 bytes, source MD5 `a5ce303bc2962fe98b733fcdfa5a842b`.
- [modern_arm_chair_01_pillow_nor_gl_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_pillow_nor_gl_1k.jpg), 302377 bytes, source MD5 `6804f34108fcc755f0c84dd3c638270c`.
- [modern_arm_chair_01_legs_nor_gl_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_legs_nor_gl_1k.jpg), 560864 bytes, source MD5 `7cece7eccf75588af5b5df9b095d2c97`.
- [modern_arm_chair_01_pillow_arm_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_pillow_arm_1k.jpg), 321223 bytes, source MD5 `772495ddbf26ca3de4b31298f10113b9`.
- [modern_arm_chair_01_legs_diff_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_legs_diff_1k.jpg), 460937 bytes, source MD5 `778f1897e07ff81b2bc338f3d463ad1f`.
- [modern_arm_chair_01_legs_arm_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_legs_arm_1k.jpg), 577931 bytes, source MD5 `9c69cb001df175bddf6d1c2436567fb7`.
- [modern_arm_chair_01.bin](https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/modern_arm_chair_01/modern_arm_chair_01.bin), 240728 bytes, source MD5 `5a8f2ea1c79ea484140e484b2a621670`.
- [modern_arm_chair_01_pillow_diff_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modern_arm_chair_01/modern_arm_chair_01_pillow_diff_1k.jpg), 228851 bytes, source MD5 `2e4f64c633c3cb1656ad3eabdb3f0607`.
- [coffee_table_round_01_1k.gltf](https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/coffee_table_round_01/coffee_table_round_01_1k.gltf), 2776 bytes, source MD5 `fa8772e8942e1863230b6745105c9a8e`.
- [coffee_table_round_01_diff_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/coffee_table_round_01/coffee_table_round_01_diff_1k.jpg), 447037 bytes, source MD5 `601977ab1b864988194728e1dda076a8`.
- [coffee_table_round_01_arm_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/coffee_table_round_01/coffee_table_round_01_arm_1k.jpg), 721708 bytes, source MD5 `b44425836ab0c932fe4ff136ce6f2fe8`.
- [coffee_table_round_01.bin](https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/coffee_table_round_01/coffee_table_round_01.bin), 131112 bytes, source MD5 `a664b067fa0ae9b6e0a8fa5878986816`.
- [coffee_table_round_01_nor_gl_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/coffee_table_round_01/coffee_table_round_01_nor_gl_1k.jpg), 260520 bytes, source MD5 `81a9885a83ff0b259514e8bce38b6b69`.
- [brown_photostudio_02_1k.hdr](https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/brown_photostudio_02_1k.hdr), 1648130 bytes, source MD5 `1362911793f932724326e6e56421f102`.
- [wood_floor_diff_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor/wood_floor_diff_1k.jpg), 734493 bytes, source MD5 `b7e927d2bf2f8f103820ff3890c8407c`.
- [wood_floor_nor_gl_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor/wood_floor_nor_gl_1k.jpg), 423303 bytes, source MD5 `620f174d2c09b579c5d02d37b2106668`.
- [wood_floor_rough_1k.jpg](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor/wood_floor_rough_1k.jpg), 527754 bytes, source MD5 `36146634f1dbd1bc30cd071857584c10`.

## Local fonts

The interface uses official Google Fonts Latin variable WOFF2 files. They are unchanged copies of the Google Fonts distribution. The first remote `@import` line in `src/index.css` was replaced with local `@font-face` declarations; the rest of that stylesheet was preserved.

| Local file under `public/assets/fonts` | Source | License | Bytes |
| --- | --- | --- | ---: |
| `dm-sans-latin-variable.woff2` | [Google Fonts DM Sans Latin variable file](https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2) | SIL Open Font License 1.1 | 36,980 |
| `manrope-latin-variable.woff2` | [Google Fonts Manrope Latin variable file](https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSvfedN4.woff2) | SIL Open Font License 1.1 | 24,576 |
| `dmsans-OFL.txt` | [Official DM Sans license](https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt) | License and copyright notice | 4,482 |
| `manrope-OFL.txt` | [Official Manrope license](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt) | License and copyright notice | 4,387 |

DM Sans is copyright 2014 The DM Sans Project Authors. Manrope is copyright 2018 The Manrope Project Authors. Their complete license and copyright notices ship beside the fonts. DM Sans supports variable weights 100–1000, and Manrope supports 200–800. Each WOFF2 signature was checked. The local font files add 61,556 bytes; the two license notices add 8,869 bytes. The downloaded 3D assets, fonts and font notices total **7,662,465 bytes**. Including the original GLBs below and the 86,051-byte floor-plan reference, all files in `public/assets` total **10,615,444 bytes, 10.62 MB or 10.12 MiB**, below the 40 MB budget.

The source font URLs were resolved from [official Google Fonts CSS](https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&family=Manrope:wght@200..800&display=swap). No Google Fonts requests remain in the app's styles.

## Local SHA-256 checksums

These identify the exact delivered files.

```text
469abc5e6035b6c450bae8adbb448f8d1fa7c51d9e384e501516c28352c91b58  public/assets/environment/brown-photostudio-02-1k.hdr
fa89c1e3fa938a0ef63a94c23fc474f6dcc52f1c78487c0088eb00a824661d82  public/assets/floorplans/original-floor-plan.jpg
468d56b6b25b05b70190b6c233d773f6f1770e8579827ce022a57f03fa8002fb  public/assets/fonts/dm-sans-latin-variable.woff2
9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1  public/assets/fonts/dmsans-OFL.txt
58172e0c0fac2cda8a37b348164bb55e44b0e69051e557e92b1d3f6910141f7b  public/assets/fonts/manrope-OFL.txt
e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f  public/assets/fonts/manrope-latin-variable.woff2
e63d43aa97f499c95f7b02cff070c78fb68017a1f423b261bbd62d8eb4452049  public/assets/models/modern-arm-chair.glb
4360a774f7460f665e0aac19e6a80e5d3386d8fd6ac4a677434a3ecd6f211cb5  public/assets/models/round-coffee-table.glb
2a1c07687b6dbb214c4b9213739c6d92d425f1f0fc8ab3ac157f105d78240789  public/assets/textures/wood-floor-color.jpg
452247f0d0d1b7fc7f8324ff3b6ed60bcc6de1405f4284eeb8d9bce90d4939c2  public/assets/textures/wood-floor-normal.jpg
061f1e1293251b2d28c76e3fac1ea9452b0e8648bb8f9b3728e09db386166e5c  public/assets/textures/wood-floor-roughness.jpg
```

## Original furniture GLBs

Every one of the 22 catalog entries now has a non-null local GLB URL, numeric scale and footprint in metres. The two downloaded GLBs keep their existing offsets and scales. The other 20 entries use the original geometry exported from `scripts/original-furniture.tsx`. Coffee-table books and bowl are an additional original detail GLB referenced by that catalog entry. There is no runtime procedural furniture fallback.

Reproduce these files with `bun run assets:export`. `scripts/export-furniture.mjs` bakes the existing transforms, welds duplicate vertices while preserving normal and UV seams, and merges opaque parts that share a material and shadow behavior. It keeps transparent shower panels separate. This reduces 334 source meshes to 114 exported meshes without lossy simplification. All source-versus-export bounds differ by less than 0.000003 m. The material palette, bed width, lamp support height, pendant elevation, source orientation and coffee-table decoration scale are preserved. Materials are shared across original asset files when loaded.

The compact single bed is authored at 0.90 × 2.00 m with one pillow, the same 1.03 m headboard height, unchanged bedding elevation, and the shared oak/linen palette. Its dimensions are baked into the mesh at catalog scale 1; the existing double-bed asset is unchanged.

The following assets were authored locally by Typed Floor Plan Studio contributors under the repository MIT license. Their source is [original-furniture.tsx](scripts/original-furniture.tsx), not an external download. They have no external source URL.

| Catalog key or detail | Local GLB under `public` | Bytes | Meshes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `sofa` | `/assets/models/original/sofa.glb` | 160,976 | 5 | `36d07245c88166a3e7f94fcd62558ffe434c3bcc58bb6147031e1b18072fdb03` |
| `rug` | `/assets/models/original/rug.glb` | 611,544 | 3 | `229209212b91b244d91833ae9557629e40f851d04bad7d46e1b8d7f31e1a0cdb` |
| `floorLamp` | `/assets/models/original/floorLamp.glb` | 17,380 | 3 | `9fd4a4c4cd72a105bffd5b1912f525710145c587ae4b69c4e58de9a3ca9e4de9` |
| `plant` | `/assets/models/original/plant.glb` | 92,832 | 6 | `79f45fa94d4e9ffb3e01a6d2ab9a7bea22b35afe16cb24d76fccdfa24b1a326b` |
| `mediaConsole` | `/assets/models/original/mediaConsole.glb` | 353,196 | 6 | `91b3df20b6a47ac0c5e96b80d83cd8d95258e277bb32aea5b9d0e9fe0d480235` |
| `diningTable` | `/assets/models/original/diningTable.glb` | 87,384 | 7 | `484ed875278290cc24fd7e1a3c847c5e96179684ee6e106364875c00c12abe61` |
| `diningChair` | `/assets/models/original/diningChair.glb` | 78,924 | 3 | `7ec761519067ec46a7baddf852c47c88630478ff8bd615df848d5ffc90d957a8` |
| `pendant` | `/assets/models/original/pendant.glb` | 33,976 | 4 | `0f1e5156137fc6450b74c69657f0f23f62b25541d7489784974f6128df38e463` |
| `kitchenCounter` | `/assets/models/original/kitchenCounter.glb` | 205,052 | 11 | `6a5e426ae8da900b5a6e0ba0df1a2a26e9c2d4d9ecb5ca2dcea563748a3d0327` |
| `kitchenCooker` | `/assets/models/original/kitchenCooker.glb` | 231,344 | 11 | `1ec762a62b336b215d1517a564f1a02053efc51d05be1d7b1f6ead8594fae89c` |
| `island` | `/assets/models/original/island.glb` | 109,424 | 7 | `a38af51c6d85e62b7c45998b2440d0a55dded10edbfd2c0f27445b646caabddd` |
| `stool` | `/assets/models/original/stool.glb` | 55,296 | 4 | `009dc04e7b522a98cecb126076c9a58678c09ea5b023aff0ee52030f18575d7a` |
| `bed` | `/assets/models/original/bed.glb` | 160,416 | 6 | `341f6afcdca7083c50336c62764b007c32f0d7a56f26560e75c16d1193473e66` |
| `singleBed` | `/assets/models/original/singleBed.glb` | 140,780 | 6 | `57e3f555ba327c04a90c82d4be345e7d2b66cbb0e4331d49726e6b5a27da3a0c` |
| `sideTable` | `/assets/models/original/sideTable.glb` | 32,652 | 3 | `f5e8030173dd309009c12f2d55dc696c37ca6f3f9dc6e1e3cc53ebd991be3c83` |
| `wardrobe` | `/assets/models/original/wardrobe.glb` | 90,916 | 4 | `1bdfa0bf085fb92dfa1d0f20a50477f1c3900c40f48ceefe434cb942e6b6f848` |
| `tableLamp` | `/assets/models/original/tableLamp.glb` | 20,432 | 4 | `50f73839bc81da469827ea174ed61c0b9cb651e119aaee65681d8cfd1b53b3e6` |
| `vanity` | `/assets/models/original/vanity.glb` | 139,084 | 6 | `8f1e5b69ea92dae6301c812a8e7a0271b428f4024e758f38f61db8b1095fd736` |
| `toilet` | `/assets/models/original/toilet.glb` | 58,008 | 3 | `7a277f8213c0a4fde7e6495931c927162e7bc387e7318e1d2ccfe905404f2733` |
| `shower` | `/assets/models/original/shower.glb` | 116,316 | 6 | `7e49ebd69206263a18bc05e0efa8d4112949ac7e6332c53006eeb886745d6f6d` |
| `coffee-table-styling` | `/assets/models/original/coffee-table-styling.glb` | 70,996 | 6 | `745143cc1c48d46079b932e874caed86f8cbf6d2f6c4562e0804f3eb20d1f006` |

The 21 original GLBs total **2,866,928 bytes**. Their bounds, triangle counts, palette names and optimization counts are recorded in `artifacts/original-glb-manifest.json`. All 22 catalog assets are loaded through `catalog.url`; the coffee-table decoration uses `catalog.detailsUrl`. The unified loader applies `catalog.scale` once and only the explicit catalog origin offsets.

## Schematic fixed fixtures

`src/components/FixedFixture.tsx` supplies eight dimension-driven fixture types for architectural layouts: counter, basin, toilet, bath, shower, wardrobe, washer and hob. These are original local geometry under the repository MIT license, using shared Three.js geometry and materials. They add no downloaded asset files. The existing GLB furniture catalog and designer apartment assets are unchanged. Manually imported scene documents stay in the user's tab and are not bundled application assets. The built-in 4 bedrooms layout, its wabi-sabi furniture arrangement and its source image are saved project files.
