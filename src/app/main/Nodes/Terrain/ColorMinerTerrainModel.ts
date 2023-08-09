import { ATerrainModel } from "../../../../anigraph/scene/nodes/terrain/ATerrainModel";
import {
    ASerializable,
    CreatesShaderModels, SeededRandom, Vec2, Vec3
} from "../../../../anigraph";
import { ColorMinerTerrainShaderModel } from "./ColorMinerTerrainShaderModel";
import type { TransformationInterface } from "../../../../anigraph";
import { ATexture } from "../../../../anigraph/rendering/ATexture";
import { ADataTextureFloat1D, ADataTextureFloat4D } from "../../../../anigraph/rendering/image";
import * as THREE from "three";
import { makeNoise2D } from "fast-simplex-noise";
import { AppConfigs } from "../../../AppConfigs";
import { Color } from "../../../../anigraph/math";

@ASerializable("ColorMinerTerrainModel")
export class ColorMinerTerrainModel extends ATerrainModel {
    /**
     * The shader model class
     */
    static ShaderModelClass: CreatesShaderModels = ColorMinerTerrainShaderModel;

    /**
     * Reusable instance of the shader model, which is a factory for creating shader materials
     */
    static ShaderModel: ColorMinerTerrainShaderModel;

    /**
     * Function to load the shader
     */
    static async LoadShader(...args: any[]) {
        this.ShaderModel = await this.ShaderModelClass.CreateModel("terrain")
    }

    RunOverMap = new Map<string, Vec2[]>();

    textureWrapX: number = 5;
    textureWrapY: number = 5;

    constructor(
        width?: number,
        height?: number,
        widthSegments?: number,
        heightSegments?: number,
        transform?: TransformationInterface,
        textureWrapX?: number,
        textureWrapY?: number
    ) {
        super(width, height, widthSegments, heightSegments, transform);
        if (textureWrapX !== undefined) { this.textureWrapX = textureWrapX; }
        if (textureWrapY !== undefined) { this.textureWrapY = textureWrapY; }
    }

    getTerrainHeightAtPoint(p: Vec2) {
        //you can access height map pixels using something like this:
        /**
         *  you can access height map pixels using something like this:
         *  this.heightMap.pixelData.getPixelNN(5, 5);
         */
        return this.heightMap.pixelData.getPixelNN(p.x, p.y);
    }

    setTerrainHeightAtPoint(p: Vec2, d: number, uid: string) {
        if (this.RunOverMap.has(uid)) {
            let curr: Vec2[] = this.RunOverMap.get(uid)!;
            let cond = false;
            curr.forEach(function (val) {
                if (val.isEqualTo(p)) {
                    cond = true;
                }
            });
            if (!cond) {
                let h = this.heightMap.pixelData.getPixelNN(p.x, p.y) - d;
                this.heightMap.setPixelNN(p.x, p.y, h);
                curr.push(p);
                this.RunOverMap.set(uid, curr);
            }
        }
        else {
            let h = this.heightMap.pixelData.getPixelNN(p.x, p.y) - d;
            this.heightMap.setPixelNN(p.x, p.y, h);
            this.RunOverMap.set(uid, [p]);
        }
        this.heightMap.setTextureNeedsUpdate();
    }

    setTerrainColorAtPoint(p: Vec2, c: Color, uid: string) {
        this.colorMap.setPixelNN(p.x, p.y, c);
        this.colorMap.setTextureNeedsUpdate();
    }


    static async Create(
        diffuseMap: string | ATexture,
        width?: number,
        height?: number,
        widthSegments?: number,
        heightSegments?: number,
        transform?: TransformationInterface,
        wrapTextureX?: number,
        wrapTextureY?: number,
        ...args: any[]) {

        /**
         * If the terrain shader isn't loaded, load it...
         */
        if (ColorMinerTerrainModel.ShaderModel === undefined) {
            await ColorMinerTerrainModel.LoadShader();
        }

        /**
         * Create and initialize the terrain with the provided texture
         */
        let terrain = new this(width, height, widthSegments, heightSegments, transform, wrapTextureX, wrapTextureY);
        await terrain.init(diffuseMap);
        return terrain;
    }

    async init(diffuseMap: string | ATexture, useDataTexture?: boolean) {

        /**
         * Set the diffuse color map if provided with a texture, or load it if provided with the path of a texture
         */
        if (diffuseMap instanceof ATexture) {
            this.diffuseMap = diffuseMap;
        } else {
            this.diffuseMap = await ATexture.LoadAsync(diffuseMap);
        }


        /**
         * If you want to use a data texture to implement displacement map terrain, create a heightMap data texture.
         * Most recent machines should support this feature, but I haven't verified on all platforms.
         * If it seems to fail, you might set useDataTexture to false by default.
         */
        if (useDataTexture ?? AppConfigs.UseTerrainDataTexture) {
            this.heightMap = ADataTextureFloat1D.CreateSolid(this.widthSegments, this.heightSegments, 0.5)
            this.heightMap.setMinFilter(THREE.LinearFilter);
            this.heightMap.setMagFilter(THREE.LinearFilter);
            // this.reRollHeightMap();
        }

        this.colorMap = ADataTextureFloat4D.CreateSolid(this.widthSegments * 3, this.heightSegments * 3)
        this.colorMap.setMinFilter(THREE.LinearMipmapLinearFilter);
        this.colorMap.setMagFilter(THREE.LinearFilter);
        this.colorMap.setWrapToRepeat();
        this.reRollColorMap();
        // this.setBaseColor()

        this.setMaterial(ColorMinerTerrainModel.ShaderModel.CreateMaterial(
            this.diffuseMap,
            this.heightMap,
            1,
            this.colorMap
        ));

        this.material.setTexture('color', this.colorMap);

    }

    /**
     * Can be used to re-randomize height map
     * You may find the code:
     * ```
     * let simplexNoise = makeNoise2D(randomgen.rand);
     * let noiseAtXY = simplexNoise(x, y)
     * ```
     * Useful for generating simplex noise
     *
     * @param seed
     * @param gridResX
     * @param gridResY
     */
    reRollHeightMap(seed?: number, gridResX: number = 5, gridResY: number = 5) {
        for (let y = 0; y < this.heightMap.height; y++) {
            for (let x = 0; x < this.heightMap.width; x++) {
                /**
                 * For the starter code, we are just setting the map to 0
                 */
                // this.heightMap.setPixelNN(x, y, 0);
                this.heightMap.setPixelNN(x, y, Math.sin(2 * x) * 0.2 + Math.sin(2 * y) * 0.2);
            }
        }
        this.heightMap.setTextureNeedsUpdate();
    }

    reRollColorMap(seed?: number, gridResX: number = 5, gridResY: number = 5) {
        let randomgen = new SeededRandom(seed);
        let simplexNoise = makeNoise2D(randomgen.rand);
        for (let y = 0; y < this.colorMap.height; y++) {
            for (let x = 0; x < this.colorMap.width; x++) {
                /**
                 * For the starter code, we are just setting the map to 0
                 */
                // this.heightMap.setPixelNN(x, y, 0);
                let v = simplexNoise(x * 0.1, y * 0.1);
                let color = Color.FromHSVA(0, 0, v / 8 + 0.3, (v + 1) / 2);
                // @ts-ignore
                this.colorMap.setPixelNN(x, y, color);
            }
        }
        this.colorMap.setTextureNeedsUpdate();
    }

    setBaseColor() {
        let color = Color.RandomRGBA();
        for (let y = 0; y < this.colorMap.height; y++) {
            for (let x = 0; x < this.colorMap.width; x++) {

                // @ts-ignore
                this.colorMap.setPixelNN(x, y, color);
            }
        }
    }


}
