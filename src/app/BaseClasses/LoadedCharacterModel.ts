import {ALoadedModel} from "../../anigraph/scene/nodes/loaded/ALoadedModel";
import {Particle3D} from "../../anigraph/physics/AParticle3D";
import {CharacterShaderModel} from "./CharacterShaderModel";
import {ASerializable, V3, Vec3} from "../../anigraph";
import {CharacterModelInterface} from "./CharacterModel";
import { Color } from "../../anigraph/math";


@ASerializable("LoadedCharacterModel")
export class LoadedCharacterModel extends ALoadedModel implements CharacterModelInterface{
    mass:number=1;
    velocity:Vec3 = V3();
    color:Color = Color.FromRGBA(0.6, 0.6, 0.0, 1.0)
    get position(){
        return this.transform.position;
    }
    set position(value:Vec3){
        this.transform.position = value;
    }
}
