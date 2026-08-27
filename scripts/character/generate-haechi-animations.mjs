/* eslint-disable */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const SOURCE_MESH_PATH = "public/models/haechi_v1.glb";
const OUTPUT_DIR = "public/models";
const DEGREE = Math.PI / 180;
const SAMPLES_PER_SECOND = 24;
const RIG_NODE_NAME = "rig";

const WORLD_X = [1, 0, 0];
const WORLD_Y = [0, 1, 0];
const WORLD_Z = [0, 0, 1];

const LEG_BONES = {
  left: { thigh: "DEF-thigh.L", shin: "DEF-shin.L", foot: "DEF-foot.L", toe: "DEF-toe.L" },
  right: { thigh: "DEF-thigh.R", shin: "DEF-shin.R", foot: "DEF-foot.R", toe: "DEF-toe.R" },
};

const ARM_BONES = {
  left: {
    upper: "DEF-upper_arm.L",
    upperTwist: "DEF-upper_arm.L.001",
    fore: "DEF-forearm.L",
    hand: "DEF-hand.L",
  },
  right: {
    upper: "DEF-upper_arm.R",
    upperTwist: "DEF-upper_arm.R.001",
    fore: "DEF-forearm.R",
    hand: "DEF-hand.R",
  },
};

const SPINE_BONES = ["DEF-spine.001", "DEF-spine.003", "DEF-spine.005", "DEF-spine.006"];
const TAIL_BONES = [
  "DEF-spine.008",
  "DEF-spine.009",
  "DEF-spine.010",
  "DEF-spine.011",
  "DEF-spine.012",
];
const ARM_SIDE_SIGN = { left: 1, right: -1 };

const ARM_LOWER_DEGREES = 22;
const ARM_TWIST_DEGREES = 0;
const ARM_CENTER_BIAS_DEGREES = 0;
const SHOULDER_SHARE = 1;
const ARM_SWING_DEGREES = 50;
const ELBOW_FLEX_BASE_DEGREES = 8;
const ELBOW_FLEX_SWING_DEGREES = 22;

function readGlbJson(filePath) {
  const binary = fs.readFileSync(filePath);
  const jsonChunkLength = binary.readUInt32LE(12);

  return JSON.parse(binary.subarray(20, 20 + jsonChunkLength).toString("utf8"));
}

function buildRestPose(gltfJson) {
  const nodes = gltfJson.nodes;
  const parentIndexes = new Array(nodes.length).fill(-1);

  nodes.forEach((node, index) => {
    (node.children ?? []).forEach((childIndex) => {
      parentIndexes[childIndex] = index;
    });
  });

  const localMatrices = nodes.map((node) => {
    const matrix = new THREE.Matrix4();

    if (node.matrix) {
      return matrix.fromArray(node.matrix);
    }

    return matrix.compose(
      new THREE.Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new THREE.Vector3().fromArray(node.scale ?? [1, 1, 1])
    );
  });

  const worldMatrices = new Array(nodes.length);

  const resolveWorldMatrix = (index) => {
    if (worldMatrices[index]) {
      return worldMatrices[index];
    }

    const parentIndex = parentIndexes[index];
    worldMatrices[index] =
      parentIndex < 0
        ? localMatrices[index].clone()
        : resolveWorldMatrix(parentIndex).clone().multiply(localMatrices[index]);

    return worldMatrices[index];
  };

  const restPose = new Map();

  nodes.forEach((node, index) => {
    if (!node.name) {
      return;
    }

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    resolveWorldMatrix(index).decompose(position, quaternion, scale);

    restPose.set(node.name, {
      local: new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      world: quaternion,
    });
  });

  return restPose;
}

function toWorldDelta(rotations) {
  const worldDelta = new THREE.Quaternion();

  rotations.forEach(({ axis, degrees }) => {
    worldDelta.premultiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().fromArray(axis), degrees * DEGREE)
    );
  });

  return worldDelta;
}

function toAxisUnderRotations(axis, rotations) {
  return new THREE.Vector3()
    .fromArray(axis)
    .applyQuaternion(toWorldDelta(rotations).invert())
    .toArray();
}

function toLocalQuaternion(restPose, boneName, rotations) {
  const rest = restPose.get(boneName);

  if (!rest) {
    throw new Error(`본을 찾을 수 없습니다: ${boneName}`);
  }

  const worldDelta = toWorldDelta(rotations);
  const inverseRestWorld = rest.world.clone().invert();
  const localDelta = inverseRestWorld.multiply(worldDelta).multiply(rest.world);

  return rest.local.clone().multiply(localDelta);
}

function wave(phase, offset = 0) {
  return Math.sin(2 * Math.PI * (phase + offset));
}

function easedPeak(phase, peakPhase) {
  return (1 + Math.cos(2 * Math.PI * (phase - peakPhase))) / 2;
}

function setArmPose(bones, side, { swingDegrees, liftDegrees, elbowDegrees, wristDegrees }) {
  const boneNames = ARM_BONES[side];
  const sideSign = ARM_SIDE_SIGN[side];
  const armRotations = (share) => [
    { axis: WORLD_Z, degrees: -sideSign * ARM_LOWER_DEGREES * share },
    { axis: WORLD_Y, degrees: -sideSign * ARM_TWIST_DEGREES * share },
    { axis: WORLD_X, degrees: ARM_CENTER_BIAS_DEGREES * share },
    { axis: WORLD_X, degrees: swingDegrees * share },
    { axis: WORLD_Z, degrees: sideSign * liftDegrees * share },
  ];
  const shoulderRotations = armRotations(SHOULDER_SHARE);
  const wholeArmRotations = armRotations(1);
  const forearmRotations = [...wholeArmRotations, { axis: WORLD_X, degrees: -elbowDegrees }];

  bones.set(boneNames.upper, shoulderRotations);
  bones.set(
    boneNames.upperTwist,
    armRotations(1 - SHOULDER_SHARE).map(({ axis, degrees }) => ({
      axis: toAxisUnderRotations(axis, shoulderRotations),
      degrees,
    }))
  );
  bones.set(boneNames.fore, [
    { axis: toAxisUnderRotations(WORLD_X, wholeArmRotations), degrees: -elbowDegrees },
  ]);
  bones.set(boneNames.hand, [
    { axis: toAxisUnderRotations(WORLD_X, forearmRotations), degrees: -wristDegrees },
  ]);
}

function createLegPose(phase, thighSwingDegrees, kneeFlexDegrees) {
  const thigh = -thighSwingDegrees * Math.cos(2 * Math.PI * phase);
  const knee =
    4 + kneeFlexDegrees * easedPeak(phase, 0.72) + kneeFlexDegrees * 0.22 * easedPeak(phase, 0.12);
  const ankle = -(thigh + knee) * 0.78;
  const toe = 16 * Math.max(0, Math.cos(2 * Math.PI * (phase - 0.46)));

  return { thigh, knee, ankle, toe };
}

function createWalkPose(phase) {
  const leftLeg = createLegPose(phase, 17, 30);
  const rightLeg = createLegPose(phase + 0.5, 17, 30);
  const bones = new Map();

  const applyLeg = (side, leg) => {
    const boneNames = LEG_BONES[side];

    bones.set(boneNames.thigh, [{ axis: WORLD_X, degrees: leg.thigh }]);
    bones.set(boneNames.shin, [{ axis: WORLD_X, degrees: leg.knee }]);
    bones.set(boneNames.foot, [{ axis: WORLD_X, degrees: leg.ankle }]);
    bones.set(boneNames.toe, [{ axis: WORLD_X, degrees: -leg.toe }]);
  };

  applyLeg("left", leftLeg);
  applyLeg("right", rightLeg);

  ["left", "right"].forEach((side) => {
    const forwardPhase = side === "left" ? 0.5 : 0;
    const swingRatio = Math.cos(2 * Math.PI * (phase - forwardPhase));
    const forwardRatio = easedPeak(phase, forwardPhase);

    setArmPose(bones, side, {
      swingDegrees: -ARM_SWING_DEGREES * swingRatio,
      liftDegrees: 4 + 9 * Math.abs(swingRatio),
      elbowDegrees: ELBOW_FLEX_BASE_DEGREES + ELBOW_FLEX_SWING_DEGREES * forwardRatio,
      wristDegrees: 8 * forwardRatio,
    });
  });

  SPINE_BONES.forEach((boneName, index) => {
    const bounce = 1.4 * Math.cos(4 * Math.PI * phase);
    const sway = 1.1 * wave(phase, index * 0.06);

    bones.set(boneName, [
      { axis: WORLD_X, degrees: index === SPINE_BONES.length - 1 ? -bounce : bounce },
      { axis: WORLD_Z, degrees: sway },
    ]);
  });

  TAIL_BONES.forEach((boneName, index) => {
    bones.set(boneName, [
      { axis: WORLD_Y, degrees: 7 * wave(phase, -index * 0.09) },
      { axis: WORLD_X, degrees: 4 * Math.cos(4 * Math.PI * (phase - index * 0.06)) },
    ]);
  });

  return {
    bones,
    rigTranslation: [0, 0.05 * (1 - Math.cos(4 * Math.PI * phase)) * 0.5, 0],
  };
}

function createIdlePose(phase) {
  const bones = new Map();
  const breath = wave(phase);

  ["left", "right"].forEach((side) => {
    const boneNames = LEG_BONES[side];

    bones.set(boneNames.thigh, [{ axis: WORLD_X, degrees: 1.5 + 0.8 * breath }]);
    bones.set(boneNames.shin, [{ axis: WORLD_X, degrees: 3 + 1.2 * breath }]);
    bones.set(boneNames.foot, [{ axis: WORLD_X, degrees: -3.5 - 1.6 * breath }]);
    bones.set(boneNames.toe, [{ axis: WORLD_X, degrees: 0 }]);

    setArmPose(bones, side, {
      swingDegrees: 2.5 * breath,
      liftDegrees: 2 + 1.5 * breath,
      elbowDegrees: ELBOW_FLEX_BASE_DEGREES + 5 * wave(phase, 0.1),
      wristDegrees: 3 * breath,
    });
  });

  SPINE_BONES.forEach((boneName, index) => {
    bones.set(boneName, [{ axis: WORLD_X, degrees: 1.2 * wave(phase, -index * 0.05) }]);
  });

  TAIL_BONES.forEach((boneName, index) => {
    bones.set(boneName, [{ axis: WORLD_Y, degrees: 5 * wave(phase, -index * 0.12) }]);
  });

  return {
    bones,
    rigTranslation: [0, 0.012 * (1 - Math.cos(2 * Math.PI * phase)) * 0.5, 0],
  };
}

function createIdleLookAroundPose(phase) {
  const pose = createIdlePose(phase);
  const lookAround = Math.sin(2 * Math.PI * phase) ** 3;
  const weightShift = wave(phase, 0.25);

  SPINE_BONES.forEach((boneName, index) => {
    const isHead = index === SPINE_BONES.length - 1;

    pose.bones.set(boneName, [
      { axis: WORLD_Y, degrees: isHead ? 16 * lookAround : 3 * lookAround },
      { axis: WORLD_Z, degrees: 1.6 * weightShift },
      {
        axis: WORLD_X,
        degrees: isHead ? -3 * Math.abs(lookAround) : 1 * wave(phase, -index * 0.05),
      },
    ]);
  });

  TAIL_BONES.forEach((boneName, index) => {
    pose.bones.set(boneName, [
      { axis: WORLD_Y, degrees: 11 * wave(phase * 2, -index * 0.1) },
      { axis: WORLD_X, degrees: 3 * wave(phase, -index * 0.08) },
    ]);
  });

  return pose;
}

function sampleClip(restPose, createPose, durationSeconds) {
  const frameCount = Math.round(durationSeconds * SAMPLES_PER_SECOND);
  const times = [];
  const boneTracks = new Map();
  const rigTranslations = [];

  for (let frame = 0; frame <= frameCount; frame += 1) {
    const time = (frame / frameCount) * durationSeconds;
    const pose = createPose((frame % frameCount) / frameCount);

    times.push(time);
    rigTranslations.push(...pose.rigTranslation);

    pose.bones.forEach((rotations, boneName) => {
      const quaternion = toLocalQuaternion(restPose, boneName, rotations);
      const track = boneTracks.get(boneName) ?? [];

      track.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      boneTracks.set(boneName, track);
    });
  }

  return { times, boneTracks, rigTranslations };
}

function createAnimationGltf(clipName, clip) {
  const nodes = [];
  const accessors = [];
  const bufferViews = [];
  const chunks = [];
  let byteOffset = 0;

  const pushAccessor = (values, type, componentCount) => {
    const data = Buffer.from(new Float32Array(values).buffer);

    chunks.push(data);
    bufferViews.push({ buffer: 0, byteOffset, byteLength: data.byteLength });
    byteOffset += data.byteLength;

    const accessor = {
      bufferView: bufferViews.length - 1,
      componentType: 5126,
      count: values.length / componentCount,
      type,
    };

    if (type === "SCALAR") {
      accessor.min = [Math.min(...values)];
      accessor.max = [Math.max(...values)];
    }

    accessors.push(accessor);

    return accessors.length - 1;
  };

  const timeAccessor = pushAccessor(clip.times, "SCALAR", 1);
  const samplers = [];
  const channels = [];

  const pushChannel = (nodeName, outputAccessor, targetPath) => {
    nodes.push({ name: nodeName });
    samplers.push({ input: timeAccessor, interpolation: "LINEAR", output: outputAccessor });
    channels.push({
      sampler: samplers.length - 1,
      target: { node: nodes.length - 1, path: targetPath },
    });
  };

  clip.boneTracks.forEach((values, boneName) => {
    pushChannel(boneName, pushAccessor(values, "VEC4", 4), "rotation");
  });
  pushChannel(RIG_NODE_NAME, pushAccessor(clip.rigTranslations, "VEC3", 3), "translation");

  const binary = Buffer.concat(chunks);

  return {
    gltf: {
      asset: { version: "2.0", generator: "seoul-go haechi animation generator" },
      scene: 0,
      scenes: [{ nodes: nodes.map((_, index) => index) }],
      nodes,
      buffers: [{ byteLength: binary.byteLength }],
      bufferViews,
      accessors,
      animations: [{ name: clipName, samplers, channels }],
    },
    binary,
  };
}

function writeGlb(outputPath, gltf, binary) {
  const jsonChunk = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadding = (4 - (jsonChunk.byteLength % 4)) % 4;
  const paddedJson = Buffer.concat([jsonChunk, Buffer.alloc(jsonPadding, 0x20)]);
  const binaryPadding = (4 - (binary.byteLength % 4)) % 4;
  const paddedBinary = Buffer.concat([binary, Buffer.alloc(binaryPadding)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.byteLength + 8 + paddedBinary.byteLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.byteLength, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.byteLength, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);

  fs.writeFileSync(
    outputPath,
    Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary])
  );
}

function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const restPose = buildRestPose(readGlbJson(path.join(projectRoot, SOURCE_MESH_PATH)));

  const clipDefinitions = [
    { fileName: "haechi_walk_v1.glb", clipName: "Walk", createPose: createWalkPose, duration: 1 },
    {
      fileName: "haechi_idle_01_v1.glb",
      clipName: "Idle",
      createPose: createIdlePose,
      duration: 3.5,
    },
    {
      fileName: "haechi_idle_02_v1.glb",
      clipName: "IdleLookAround",
      createPose: createIdleLookAroundPose,
      duration: 5,
    },
  ];

  clipDefinitions.forEach(({ fileName, clipName, createPose, duration }) => {
    const clip = sampleClip(restPose, createPose, duration);
    const { gltf, binary } = createAnimationGltf(clipName, clip);
    const outputPath = path.join(projectRoot, OUTPUT_DIR, fileName);

    writeGlb(outputPath, gltf, binary);
    console.log(`${fileName} 생성 완료 (${clip.times.length} keyframes)`);
  });
}

main();
