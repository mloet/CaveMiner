import {
    A3DModelLoader,
    ACameraModel, AInteractionEvent,
    AModel, AObject3DModelWrapper,
    APointLightModel, AShaderMaterial,
    Color,
    GetAppState,
    NodeTransform3D, Quaternion,
    V3, Vec2,
    Vec3,
    Vec4,
} from "../../../../anigraph";
import { BaseSceneModel, CharacterModel, CharacterModelInterface } from "../../../BaseClasses";
import {
    BotModel,
    ExampleParticleSystemModel,
    ExampleThreeJSNodeModel,
    PlayerModel,
    SphereParticle,
    TerrainModel,
    ColorMinerTerrainModel
} from "../../Nodes";
import { ATexture } from "../../../../anigraph/rendering/ATexture";
import { AppConfigs } from "../../../AppConfigs";
import { Particle3D } from "../../../../anigraph/physics/AParticle3D";
import { LoadedCharacterModel } from "../../../BaseClasses/LoadedCharacterModel";
import { ExampleLoadedCharacterModel } from "../../Nodes/Loaded/ExampleLoadedCharacterModel";
import { ABasicShaderModel } from "../../../../anigraph/rendering/shadermodels/ABasicShaderModel";
import { AddStandardUniforms } from "./HowToAddUniformToControlPanel";
import { json } from "stream/consumers";
import { PaintParticleSystemModel } from "../../Nodes/PaintParticleSystem";
// import {AddStandardUniforms} from "../HowToAddUniformToControlPanel";

let appState = GetAppState();

/**
 * Here we will define some enums that are simple strings.
 * These will be what we call different shader model instances. Note that we could just type these strings directly into
 * the code when we use them, but defining them as an enum will help avoid bugs caused by typos, and it will let you use
 * refactoring features of your IDE if you want to change these variables later.
 */
enum MyMaterialNames {
    basicshader1 = "basicshader1",
    mymaterial2 = "mymaterial2",
}


export class ColorMinerSceneModel extends BaseSceneModel {
    /**
     * Our custom terrain model
     */
    terrain!: ColorMinerTerrainModel;

    /**
     * Our custom player model, and a texture to use for our player
     */
    _player!: CharacterModelInterface;
    get player(): CharacterModelInterface {
        return this._player as LoadedCharacterModel;
    }
    set player(v: CharacterModelInterface) {
        this._player = v;
    }
    loaded3DModel!: AObject3DModelWrapper;
    playerMaterial!: AShaderMaterial;


    catModel!: AObject3DModelWrapper;
    catTexture!: ATexture;

    /**
     * An array of bots. Your
     */
    bots: BotModel[] = [];

    // paintParticles!: PaintParticleSystemModel;

    async loadModelFromFile(path: string, transform?: NodeTransform3D) {
        /**
         * Here we need to load the .ply file into an AObject3DModelWrapper instance
         */
        let meshObject = await A3DModelLoader.LoadFromPath(path)
        meshObject.sourceTransform = transform ?? new NodeTransform3D();
        return meshObject;
    }


    async PreloadAssets() {
        await super.PreloadAssets();
        await ColorMinerTerrainModel.LoadShader();
        await CharacterModel.LoadShader();

        const self = this;

        /**
         * Here we will create a shader model and name it with the string defined in `MyMaterialNames.basicshader1`.
         * The shaderName argument to CreateModel is the name used in the shader folder and glsl files under
         * `public/shaders/`
         */
        let basicshader1ShaderMaterialModel = await ABasicShaderModel.CreateModel("customexample1");
        await this.materials.setMaterialModel(MyMaterialNames.basicshader1, basicshader1ShaderMaterialModel);

        /**
         * If we want to use vertex colors in our shader, we need to set useVertexColors to true.
         * This will turn vertex colors on by default for materials created with this model.
         * Each time you create a material, you can turn off vertex colors for that material if you want.
         */
        basicshader1ShaderMaterialModel.usesVertexColors = true;

        /**
         * Once a shader model is set like this, we can access it with the material name we assigned it to like so:
         */
        this.playerMaterial = this.materials.CreateShaderMaterial(MyMaterialNames.basicshader1);
        // let amt = new AShaderMaterial();
        // amt.setModelColor(Color.FromRGBA(1, 0, 0, 1));
        // this.playerMaterial = amt;



        /**
         * Ok, now let's load a 3D model to use for our player.
         */


        /**
         * We could use a dragon with vertex colors specified in a .ply file
         */
        let dragonTransform = NodeTransform3D.FromPositionZUpAndScale(V3(), Vec3.UnitZ(), Vec3.UnitX().times(-1), 0.001);
        this.loaded3DModel = await this.loadModelFromFile("./models/ply/dragon_color_onground.ply", dragonTransform);


        /**
         * Or a cat!!! Here it is defined as a .glb file, which you can export from blender by exporting a mesh as a gltf format
         */
        // let catTransform = NodeTransform3D.FromPositionZUpAndScale(V3(), Vec3.UnitZ().times(1), Vec3.UnitY().times(-1), .008);
        // this.loaded3DModel = await this.loadModelFromFile("./models/gltf/cat.glb", catTransform);
        /**
         * Our cat comes with a texture, so lets add it to the character material
         */
        // let catTexture = await ATexture.LoadAsync("./models/gltf/Cat_diffuse.jpg");
        // this.playerMaterial.setTexture('diffuse', catTexture);

    }


    initCamera() {
        this.cameraModel = ACameraModel.CreatePerspectiveFOV(90, 1, 0.01, 10);

        this.cameraModel.setPose(
            NodeTransform3D.LookAt(
                V3(-0.2, 0.8, 0.75), V3(0, 0, 0.5),
                V3(0, 0, 0.4)
            )
        )

    }

    /**
     * The view light is a light that is attached to the camera.
     */
    initViewLight() {

        /**
         * Create a point light
         * You can have up to 16 point lights in the scene at once by default
         */
        this.viewLight = new APointLightModel(
            this.camera.pose,
            Color.FromString("#ffffff"),
            0.5,
            AppConfigs.ViewLightRange,
            1
        );

        /**
         * Add it as a child of the camera model so that it will move with the camera
         */
        this.cameraModel.addChild(this.viewLight);
    }

    async initTerrain() {
        this.terrain = await ColorMinerTerrainModel.Create(
            AppConfigs.GroundTexture, // texture
            AppConfigs.TerrainScaleX, // scaleX
            AppConfigs.TerrainScaleY, // scaleY
            AppConfigs.TerrainDataTextureWidth, // number of vertices wide
            AppConfigs.TerrainDataTextureHeight, // number of vertices tall
            undefined, // transform for terrain, identity if left blank
            AppConfigs.TerrainWrapTextureX, // number of times texture should wrap across surface in X
            AppConfigs.TerrainWrapTextureY, // number of times texture should wrap across surface in Y
        );
        this.addChild(this.terrain);
    }



    async initCharacters() {


        /**
         * First we will initialze the player and add it to the scene.
         */
        // this.playerTexture = await ATexture.LoadAsync("./images/tanktexburngreen.jpeg")
        // this.player = await PlayerModel.Create(this.playerTexture);

        /**
         * Here we will initialize our player using the loaded .ply model and the shader material model we attached to
         * the string MyMaterialNames.basicshader1
         * @type {ExampleLoadedCharacterModel}
         */
        this.player = new ExampleLoadedCharacterModel(
            this.loaded3DModel,
            this.playerMaterial
        );
        AddStandardUniforms(this.player.material);
        this.addChild(this.player);




        /**
         * Then we will create a bunch of bots with different cat faces...
         * Let's make each one a child of the last.
         */
        let parent: AModel = this;
        for (let e = 0; e < 6; e++) {
            let bot = await BotModel.Create(`./images/catfaces/idol.jpeg`);
            bot.position = new Vec3((Math.random() - 0.5) * 7.5, (Math.random() - 0.5) * 7.5, 0);
            bot.mass = 50;
            this.bots.push(bot);
            this.addChild(bot);
        }
    }


    async initScene() {
        await this.initTerrain();
        await this.initCharacters();

        // this.addChild(new ExampleThreeJSNodeModel());

        /**
         * Now let's initialize the view light
         */
        this.initViewLight();

        /**
         * Let's add the particle system controls to the control pannel...
         */
        // PaintParticleSystemModel.AddParticleSystemControls()
        /**
         * And now let's create our particle system
         */

        // this.paintParticles = new PaintParticleSystemModel(1);
        // this.player.addChild(this.paintParticles);

    }

    timeUpdate(t: number, ...args: any[]) {
        // this.basicUpdate(t, ...args);
        // this.spinBots(t, ...args);
        this.gameUpdate(t, ...args);
    }

    /**
     * Here we will separate out logic that check to see if a particle (characters implement the particle interface, so
     * this can be used on characters as well) intersects the terrain.
     * @param particle
     */
    adjustParticleHeight(particle: Particle3D) {
        let height = this.terrain.getTerrainHeightAtPoint(particle.position.xy);
        if (particle.position.z < height) { particle.position.z = height; }
    }


    colorEqual(c1: Color, c2: Color, tolerance: number) {

        let diff = [Math.abs(c1.r - c2.r), Math.abs(c1.g - c2.g), Math.abs(c1.b - c2.b), Math.abs(c1.a - c2.a)];

        for (let d of diff) {
            if (d > tolerance) {
                return false;
            }
        }
        return true;
    }


    gameUpdate(t: number, ...args: any[]) {
        for (let c of this.getDescendantList()) {
            c.timeUpdate(t);
        }
        let pos = this.player.position.clone()
        let pos2 = this.player.position.clone()
        pos.x = pos.x * 32 / 7.5 + this.terrain.heightMap.width / 2;
        pos.y = pos.y * 32 / 7.5 + this.terrain.heightMap.height / 2;
        pos2.x = pos2.x * 96 / 7.5 + this.terrain.colorMap.width / 2;
        pos2.y = pos2.y * 96 / 7.5 + this.terrain.colorMap.height / 2;
        if ((pos.x > 0 && pos.x < 64 && pos.y > 0 && pos.y < 64) && (pos2.x > 0 && pos2.x < 192 && pos2.y > 0 && pos2.y < 192)) {
            this.player.position.z = (this.terrain.getTerrainHeightAtPoint(pos.xy));
            this.terrain.setTerrainHeightAtPoint(pos.xy, .01, this.player.uid);
            this.terrain.setTerrainColorAtPoint(pos2.xy, this.player.color, this.player.uid);
        }

        let botSpeed = 0.002;
        for (let ei = 0; ei < this.bots.length; ei++) {
            let e = this.bots[ei];
            let newPosInc = this.player.position.minus(e.position).getNormalized().times(botSpeed);
            let newPos = e.position.plus(newPosInc);
            let newPos2 = newPos.clone()
            newPos2.x = newPos2.x * 96 / 7.5 + this.terrain.colorMap.width / 2;
            newPos2.y = newPos2.y * 96 / 7.5 + this.terrain.colorMap.height / 2;
            let newPosColor = this.terrain.colorMap.getPixelNN(newPos2.x, newPos2.y);
            newPosColor = Color.FromRGBA(newPosColor[0], newPosColor[1], newPosColor[2], newPosColor[3]);
            if (this.colorEqual(newPosColor, this.player.color, 1e-5)) {
                continue
            }
            e.position = newPos;
            newPos.x = newPos.x * 32 / 7.5 + this.terrain.heightMap.width / 2;
            newPos.y = newPos.y * 32 / 7.5 + this.terrain.heightMap.height / 2;
            e.position.z = this.terrain.getTerrainHeightAtPoint(newPos.xy);

        }

    }

    getCoordinatesForCursorEvent(event: AInteractionEvent) {
        return event.ndcCursor ?? new Vec2();
    }
}


