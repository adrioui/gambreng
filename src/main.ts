import { parseParticipantsFromURL } from "@/config";
import { Experience } from "@/Experience";

const container = document.getElementById("canvas-container")!;
const canvas = document.createElement("canvas");
container.appendChild(canvas);

const participants = parseParticipantsFromURL();
new Experience(canvas, participants);
