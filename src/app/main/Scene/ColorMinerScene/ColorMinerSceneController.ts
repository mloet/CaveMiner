import { BaseSceneController } from "../../../BaseClasses";
import { MainSceneModel } from "../MainSceneModel";
import { AGLContext, APointLightModel, APointLightView } from "../../../../anigraph";
import { ATriangleMeshModel, ATriangleMeshView } from "../../../../anigraph/scene/nodes";
import {
    BotModel,
    BotView,
    ExampleThreeJSNodeModel, ExampleThreeJSNodeView,
    PlayerModel,
    PlayerView,
    ColorMinerTerrainModel,
    ColorMinerTerrainView
} from "../../Nodes";
import * as THREE from "three";
import { ADebugInteractionMode } from "../../../../anigraph/scene/interactionmodes";
import { FPColorMinerPlayerInteractionMode, ExamplePlayerInteractionMode, TPColorMinerPlayerInteractionMode } from "../../InteractionModes";
import { ExamplePointerLockInteractionMode } from "../../InteractionModes/ExamplePointerLockInteractionMode";
import { ExampleLoadedCharacterModel, ExampleLoadedModel, ExampleLoadedView } from "../../Nodes/Loaded";
import {
    PaintParticleSystemModel,
    PaintParticleSystemView
} from "../../Nodes/PaintParticleSystem";

export class ColorMinerSceneController extends BaseSceneController {
    get model(): MainSceneModel {
        return this._model as MainSceneModel;
    }

    /**
     * This is where you specify the mapping from model classes to view classes.
     */
    initModelViewSpecs(): void {
        this.addModelViewSpec(APointLightModel, APointLightView);
        this.addModelViewSpec(ATriangleMeshModel, ATriangleMeshView);
        this.addModelViewSpec(ColorMinerTerrainModel, ColorMinerTerrainView);
        this.addModelViewSpec(PlayerModel, PlayerView);
        this.addModelViewSpec(BotModel, BotView);
        this.addModelViewSpec(ExampleThreeJSNodeModel, ExampleThreeJSNodeView);
        // Note that we can use the same view for two different models!
        this.addModelViewSpec(ExampleLoadedCharacterModel, ExampleLoadedView);
        this.addModelViewSpec(ExampleLoadedModel, ExampleLoadedView);
        // this.addModelViewSpec(PaintParticleSystemModel, PaintParticleSystemView);

    }

    async initScene(): Promise<void> {
        /**
         * Set up the skybox background
         */
        await super.initScene();
        // let path = './images/cube/MilkyWay/dark-s_';
        // let format = '.jpg'
        // const urls = [
        //     path + 'px' + format, path + 'nx' + format,
        //     path + 'py' + format, path + 'ny' + format,
        //     path + 'pz' + format, path + 'nz' + format
        // ];

        let path = './images/cave';
        let format = '.jpg'
        // const urls = [
        //     path
        // ];

        // let path = './images/cube/Cave/cave';
        // let format = '.jpg'
        const urls = [
            path + format, path + format,
            path + format, path + format,
            path + format, path + format
        ];

        /**
         * If you want to change the skybox, you will need to provide the appropriate urls to the corresponding textures
         * from a cube map
         */
        const reflectionCube = new THREE.CubeTextureLoader().load(urls);
        reflectionCube.rotation = Math.PI * 0.25;
        this.view.threejs.background = reflectionCube;
    }

    initInteractions() {

        /**
         * We will define the debug interaction mode here.
         * The debug mode is offered mainly to provide camera controls for developing and debugging non-control-related
         * features. It may also be useful as an example for you to look at if you like.
         */
        super.initInteractions();
        let debugInteractionMode = new ADebugInteractionMode(this);
        this.defineInteractionMode("Debug", debugInteractionMode);


        /**
         * This code adds the ExamplePlayer interaction mode and sets it as the current active mode
         */
        let FPplayerInteractionMode = new FPColorMinerPlayerInteractionMode(this);
        this.defineInteractionMode("First Person Player", FPplayerInteractionMode);

        let TPplayerInteractionMode = new TPColorMinerPlayerInteractionMode(this);
        this.defineInteractionMode("Third Person Player", TPplayerInteractionMode);


        let pointerLockInteractionMode = new ExamplePointerLockInteractionMode(this);
        this.defineInteractionMode("ExamplePointerLock", pointerLockInteractionMode);

        /**
         * For starters we will default to the debug mode.
         */
        this.setCurrentInteractionMode("Third Person Player")

    }

    onAnimationFrameCallback(context: AGLContext) {
        // let's update the model
        let time = this.time;
        this.model.timeUpdate(time);

        /**
         * And the interaction mode... This is important for things like camera motion filtering.
         */
        this.interactionMode.timeUpdate(time)

        // clear the rendering context
        context.renderer.clear();
        // this.renderer.clear(false, true);

        // render the scene view
        context.renderer.render(this.view.threejs, this._threeCamera);
    }

}