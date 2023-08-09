import {
    AClickInteraction,
    ADOMPointerMoveInteraction, ADragInteraction,
    AInteractionEvent,
    AKeyboardInteraction,
    ASerializable,
    Mat3,
    Mat4,
    NodeTransform2D
} from "../../../anigraph";
import { AWheelInteraction } from "../../../anigraph/interaction/AWheelInteraction";
import { ASceneInteractionMode } from "../../../anigraph/scene/interactionmodes/ASceneInteractionMode";
import { NodeTransform3D, Quaternion, Vec2, Vec3 } from "../../../anigraph";
import type { HasInteractionModeCallbacks } from "../../../anigraph";
import { MainSceneController } from "../Scene/MainSceneController";
import { MainAppInteractionMode } from "../../BaseClasses/MainAppInteractionMode";
import { GetAppState } from "../MainAppState";


@ASerializable("TPColorMinerPlayerInteractionMode")
export class TPColorMinerPlayerInteractionMode extends MainAppInteractionMode {

    /**
     * You may want to define some parameters to adjust the speed of controls...
     */
    mouseMovementSpeed: number = 3;
    keyboardMovementSpeed: number = 0.04;
    cameraOrbitSpeed: number = 3;
    minerRotationAngle: number = (Math.PI)/16;
    offsets: Vec3 = new Vec3(1,-1,1.5);
    priorPosition: Vec3 = Vec3.UnitY();

    get camera() {
        return this.model.camera;
    }

    constructor(owner?: MainSceneController,
        name?: string,
        interactionCallbacks?: HasInteractionModeCallbacks,
        ...args: any[]) {
        super(name, owner, interactionCallbacks, ...args);
        this.reset();
    }

    get player() {
        return this.model.player;
    }

    reset() {
        // You can reset the control mode here
        let pos = this.player.position.clone();
        let rot = this.player.transform.rotation.getAxisAndAngle();
        // pos.z += (this.offsets.z);
        this.priorPosition = pos;
        pos.z = this.camera.pose.position.z;
        if (rot.axis.isEqualTo(Vec3.UnitZ())){
            pos.y += (this.offsets.y) * Math.cos(Math.PI*2-rot.angle);
            pos.x += (this.offsets.x) * Math.sin(Math.PI*2-rot.angle);
        }
        else{
            pos.y += (this.offsets.y) * Math.cos(rot.angle);
            pos.x += (this.offsets.x) * Math.sin(rot.angle);
        }        
        this.camera.pose = NodeTransform3D.LookAt(
            pos,
            this.player.position,
            new Vec3(0, 0, 1)
        )
        this.player.velocity = this.player.position.minus(this.priorPosition);

    }

    /**
     * This gets called immediately before the interaction mode is activated. For now, we will call reset()
     * @param args
     */
    beforeActivate(...args: any[]) {
        super.beforeActivate(...args);
        this.reset();
    }

    /**
     * Create an instance in a single call, instead of calling new followed by init
     * @param owner
     * @param args
     * @returns {ASceneInteractionMode}
     * @constructor
     */
    static Create(owner: MainSceneController, ...args: any[]) {
        let controls = new this();
        controls.init(owner);
        return controls;
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction) {
        let zoom = (event.DOMEvent as WheelEvent).deltaY;
        console.log(`Wheel moved! deltaY: ${zoom}`);
    }

    onMouseMove(event: AInteractionEvent, interaction: ADOMPointerMoveInteraction) {
        // console.log(`mouse move! ${event}`);
    }

    onKeyDown(event: AInteractionEvent, interaction: AKeyboardInteraction) {
        if (interaction.keysDownState['w']) {
            let rot = this.player.transform.rotation.getAxisAndAngle();
            let y = this.player.transform.rotation.getLocalY();
            let z = this.player.transform.rotation.getLocalZ();
            let pos = this.player.position.clone();
            let camPos = this.camera.pose.position.clone()
            
            if (rot.axis.isEqualTo(Vec3.UnitZ())){
                pos.y = this.player.position.y + (this.keyboardMovementSpeed)*Math.cos(rot.angle);
                pos.x = this.player.position.x + (this.keyboardMovementSpeed)*Math.sin(rot.angle);

                camPos.y = this.camera.pose.position.y + (this.keyboardMovementSpeed)*Math.cos(rot.angle);
                camPos.x = this.camera.pose.position.x + (this.keyboardMovementSpeed)*Math.sin(rot.angle);
            }
            else{
                pos.y = this.player.position.y + (this.keyboardMovementSpeed)*Math.cos(rot.angle);
                pos.x = this.player.position.x - (this.keyboardMovementSpeed)*Math.sin(rot.angle);

                camPos.y = this.camera.pose.position.y + (this.keyboardMovementSpeed)*Math.cos(rot.angle);
                camPos.x = this.camera.pose.position.x - (this.keyboardMovementSpeed)*Math.sin(rot.angle);
            }
            if (pos.x > -7.5 && pos.x < 7.5 && pos.y > -7.5 && pos.y < 7.3 ){
                this.player.position = pos;
                this.camera.pose.position = camPos;
                this.player.setTransform(NodeTransform3D.FromPositionZUpAndScale(this.player.position, z, y, 1));
            }
            
        }
        if (interaction.keysDownState['a']) {      
            let qP = Quaternion.FromAxisAngle(Vec3.UnitZ(),this.minerRotationAngle);
            let playerPose = this.player.transform;
            playerPose = new NodeTransform3D(this.player.position, playerPose.rotation.times(qP));
            this.player.setTransform(playerPose);

            let diff = this.camera.pose.position.minus(this.player.position);
            let r = Mat3.Rotation(this.minerRotationAngle);
            this.camera.pose.position = r.times(diff).plus(this.player.position)
            this.reset();  
        }
        if (interaction.keysDownState['d']) {
            let qP = Quaternion.FromAxisAngle(Vec3.UnitZ(),-1 * this.minerRotationAngle);
            let playerPose = this.player.transform;
            playerPose = new NodeTransform3D(this.player.position, playerPose.rotation.times(qP));
            this.player.setTransform(playerPose);
            this.reset();  
        }
    }

    onKeyUp(event: AInteractionEvent, interaction: AKeyboardInteraction) {
        if (!interaction.keysDownState['w']) {
        }
        if (!interaction.keysDownState['a']) {
        }
        if (!interaction.keysDownState['s']) {
        }
        if (!interaction.keysDownState['d']) {
        }
        if (!interaction.keysDownState['r']) {
        }
        if (!interaction.keysDownState['f']) {
        }
    }

    onDragStart(event: AInteractionEvent, interaction: ADragInteraction): void {
        /**
         * Here we will track some interaction state. Specifically, the last cursor position.
         */
        interaction.setInteractionState('lastCursor', event.ndcCursor);
    }
    onDragMove(event: AInteractionEvent, interaction: ADragInteraction): void {
         if(!event.ndcCursor){
            return;
        }
        let mouseMovement = event.ndcCursor.minus(interaction.getInteractionState('lastCursor'));
        interaction.setInteractionState('lastCursor', event.ndcCursor);
        let rotationY = mouseMovement.y*this.cameraOrbitSpeed;
        let qY = Quaternion.FromAxisAngle(this.camera.right, rotationY);

        let newPose = this.camera.pose.clone();
        newPose = new NodeTransform3D(qY.appliedTo(newPose.position), newPose.rotation.times(qY));
        newPose = NodeTransform3D.LookAt(
            newPose.position,
            this.player.position,
            new Vec3(0, 0, 1)
        )
        this.cameraModel.setPose(newPose);
        this.cameraModel.signalTransformUpdate();
    }
    onDragEnd(event: AInteractionEvent, interaction: ADragInteraction): void {
        let cursorWorldCoordinates: Vec2 | null = event.ndcCursor;
        let dragStartWorldCoordinates: Vec2 | null = interaction.dragStartEvent.ndcCursor;
    }

    /**
     * This would be a good place to implement the time update of any movement filters
     * @param t
     * @param args
     */
    timeUpdate(t: number, ...args: any[]) {
    }

}
