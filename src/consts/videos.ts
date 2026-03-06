export interface Video {
  id: number;
  title: string;
  duration: string;
  author: string;
  playbackId: string;
}

export const VIDEOS: Video[] = [
  {
    id: 1,
    title: "Derechos laborales",
    duration: "0:22",
    author: "María - Secretaria",
    playbackId: "qnW60201g6ElMky9DCTcvG4OSbNI291wPQvXQoAg6L6fs",
  },
  {
    id: 2,
    title: "Denunciar correctamente",
    duration: "0:38",
    author: "Juan - Abogado",
    playbackId: "yJv7T4SCwsJzB2B1JPOpBklp9pR6kwD00PigAbr02nmHc",
  },
  {
    id: 3,
    title: "Iniciar un reclamo",
    duration: "0:25",
    author: "Laura - Coordinadora",
    playbackId: "GP2v72mhK00U6CKYtNtYYBcu2XxGKb02LITja5errNeBQ",
  },
  {
    id: 4,
    title: "Accidente in itinere",
    duration: "0:25",
    author: "Ana - Asistente Legal",
    playbackId: "c3mJjCGsSdVxLzTuogrqMvYoH500102I5Z4ZDVqtJ02wMU",
  },
];

export const muxThumbnail = (playbackId: string, time = 0): string =>
  `https://image.mux.com/${playbackId}/thumbnail.webp?time=${time}`;
