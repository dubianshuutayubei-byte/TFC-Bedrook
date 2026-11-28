// Bedrock item mappings of the official TFC 3.2.26 entity loot tables.
// Species-specific TFC food/hide IDs are mapped to the pack's current generic food,
// vanilla leather, and vanilla bone items until dedicated TFC item variants are registered.
const meat=(min,max,notPredated=false)=>({item:"tfc:raw_meat",min,max,...(notPredated?{notPredated:true}:{})});
const hide=(chance=1)=>({item:"minecraft:leather",min:1,max:1,chance});
const bone=(min,max)=>({item:"minecraft:bone",min,max});
const feather=(min,max)=>({item:"minecraft:feather",min,max});
const fish=()=>({item:"minecraft:cod",min:1,max:1,playerKillOnly:true});
const shellfish=()=>({item:"tfc:raw_meat",min:1,max:1,playerKillOnly:true});
const blubber=()=>({item:"minecraft:slime_ball",min:2,max:7});
export const FAUNA_DEATH_LOOT = Object.freeze({
 "tfc:alpaca":[meat(6,16),bone(1,4),hide()],
 "tfc:black_bear":[hide(),bone(1,6)],
 "tfc:bluegill":[fish()],
 "tfc:boar":[meat(5,10,true),hide(0.8),bone(1,3)],
 "tfc:bongo":[meat(6,10,true),hide(),bone(1,6)],
 "tfc:caribou":[meat(6,11,true),hide(),bone(1,6)],
 "tfc:cougar":[hide(),bone(1,6)],
 "tfc:crappie":[fish()],
 "tfc:crayfish":[shellfish()],
 "tfc:crocodile":[hide(),bone(1,7)],
 "tfc:deer":[meat(4,10,true),hide(),bone(1,6)],
 "tfc:direwolf":[hide(),bone(1,4)],
 "tfc:duck":[meat(1,6),feather(4,10)],
 "tfc:gazelle":[meat(3,8,true),hide(),bone(1,6)],
 "tfc:grizzly_bear":[hide(),bone(1,6)],
 "tfc:grouse":[meat(2,3,true),bone(1,2),feather(4,10)],
 "tfc:horseshoe_crab":[shellfish()],
 "tfc:hyena":[hide(),bone(1,3)],
 "tfc:isopod":[shellfish()],
 "tfc:jellyfish":[],
 "tfc:lake_trout":[fish()],
 "tfc:largemouth_bass":[fish()],
 "tfc:lion":[hide(),bone(1,6)],
 "tfc:lobster":[shellfish()],
 "tfc:manatee":[blubber(),bone(1,5)],
 "tfc:moose":[meat(10,20,true),hide(),bone(1,10)],
 "tfc:musk_ox":[meat(13,19),bone(1,4),hide()],
 "tfc:octopoteuthis":[{item:"minecraft:glow_ink_sac",min:1,max:10,playerKillOnly:true},meat(1,1)],
 "tfc:orca":[blubber(),bone(1,5)],
 "tfc:panther":[hide(),bone(1,6)],
 "tfc:peafowl":[meat(2,4,true),bone(1,2),feather(8,14)],
 "tfc:penguin":[feather(1,3),hide(0.5),bone(1,2)],
 "tfc:pheasant":[meat(2,3,true),bone(1,2),feather(4,10)],
 "tfc:quail":[meat(1,6),feather(4,12)],
 "tfc:rainbow_trout":[fish()],
 "tfc:sabertooth":[hide(),bone(1,8)],
 "tfc:smallmouth_bass":[fish()],
 "tfc:tiger":[hide(),bone(1,7)],
 "tfc:turkey":[meat(2,4,true),bone(1,2),feather(6,10)],
 "tfc:wildebeest":[meat(8,14,true),hide(0.8),bone(1,3)],
 "tfc:yak":[meat(13,19),hide(),bone(1,4)]
});
