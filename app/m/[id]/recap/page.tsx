"use client";

import { collection, getDocs } from "firebase/firestore/lite";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { TbHeart, TbPlayerPause, TbPlayerPlay, TbX } from "react-icons/tb";

import { database } from "@/config/server";

// Tipos de animações de transição
type TransitionType =
  | "slideDown"
  | "slideUp"
  | "fade"
  | "zoom"
  | "slideLeft"
  | "slideRight";

// Função para obter animação de transição baseada no índice
const getTransitionAnimation = (index: number): TransitionType => {
  const types: TransitionType[] = [
    "slideDown",
    "slideUp",
    "fade",
    "zoom",
    "slideLeft",
    "slideRight",
  ];
  return types[index % types.length];
};

// Função para obter variantes de animação de entrada
const getInitialVariants = (type: TransitionType) => {
  switch (type) {
    case "slideDown":
      return { opacity: 0, y: -100 };
    case "slideUp":
      return { opacity: 0, y: 100 };
    case "fade":
      return { opacity: 0, scale: 1.1 };
    case "zoom":
      return { opacity: 0, scale: 0.8 };
    case "slideLeft":
      return { opacity: 0, x: 100 };
    case "slideRight":
      return { opacity: 0, x: -100 };
    default:
      return { opacity: 0, scale: 1.1 };
  }
};

// Função para obter variantes de animação de saída
const getExitVariants = (type: TransitionType) => {
  switch (type) {
    case "slideDown":
      return { opacity: 0, y: 100 };
    case "slideUp":
      return { opacity: 0, y: -100 };
    case "fade":
      return { opacity: 0, scale: 0.9 };
    case "zoom":
      return { opacity: 0, scale: 1.2 };
    case "slideLeft":
      return { opacity: 0, x: -100 };
    case "slideRight":
      return { opacity: 0, x: 100 };
    default:
      return { opacity: 0, scale: 0.9 };
  }
};

// Função para obter animação de apresentação da foto
const getPhotoAnimation = (index: number) => {
  const animations = [
    // Zoom suave
    {
      scale: [1, 1.08, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    // Pan horizontal
    {
      x: [0, 20, 0],
      scale: [1, 1.05, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
    // Pan vertical
    {
      y: [0, -15, 0],
      scale: [1, 1.06, 1],
      transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
    },
    // Zoom mais pronunciado
    {
      scale: [1, 1.1, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
    // Rotação sutil com zoom
    {
      scale: [1, 1.07, 1],
      rotate: [0, 1, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    },
  ];
  return animations[index % animations.length];
};

export default function RecapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [photos, setPhotos] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
        const colRef = collection(database, `feed/${id}/photos`);
        const querySnapshot = await getDocs(colRef);

        const photosData: any[] = [];

        querySnapshot.forEach((doc) => {
          photosData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Ordenar por time (mais antiga para mais nova para o recap)
        photosData.sort((a, b) => {
          const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
          const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
          return timeA.getTime() - timeB.getTime(); // Ordem crescente
        });

        setPhotos(photosData);
      } catch (error) {
        console.error("Erro ao buscar fotos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [id]);

  // Configurar música de fundo
  useEffect(() => {
    // Usando o arquivo music.mp3 da pasta public
    const audioUrl = "/music.mp3";

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = audioUrl;
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Controlar reprodução da música
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Erro ao reproduzir música:", error);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Avançar slides automaticamente
  useEffect(() => {
    if (photos.length === 0 || !isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Duração de cada slide (4 segundos)
    const slideDuration = 4000;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= photos.length - 1) {
          // Se chegou ao final, pode reiniciar ou parar
          return 0; // Reinicia do início
        }
        return prevIndex + 1;
      });
    }, slideDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [photos.length, isPlaying]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    router.back();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Carregando recap...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Nenhuma foto encontrada</div>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white p-2"
        >
          <TbX className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Controles */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleTogglePlay}
          className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white hover:bg-black/70 transition"
        >
          {isPlaying ? (
            <TbPlayerPause className="w-6 h-6" />
          ) : (
            <TbPlayerPlay className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white hover:bg-black/70 transition"
        >
          <TbX className="w-6 h-6" />
        </button>
      </div>

      {/* Indicador de progresso */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{
            width: isPlaying
              ? `${((currentIndex + 1) / photos.length) * 100}%`
              : "0%",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Slides das fotos */}
      <AnimatePresence mode="wait">
        {photos[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={getInitialVariants(getTransitionAnimation(currentIndex))}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={getExitVariants(getTransitionAnimation(currentIndex))}
            transition={{
              duration: 1.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <motion.img
              src={photos[currentIndex]?.photo}
              alt={photos[currentIndex]?.title || "Foto"}
              className="w-full h-full object-cover"
              initial={{ scale: 1, x: 0, y: 0, rotate: 0 }}
              animate={getPhotoAnimation(currentIndex)}
            />

            {/* Corações animados para likes */}
            {photos[currentIndex]?.likes &&
              photos[currentIndex].likes.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {photos[currentIndex].likes.map(
                    (_: any, likeIndex: number) => {
                      // Distribuir corações em posições circulares ao redor do centro
                      const totalLikes = photos[currentIndex].likes.length;
                      const angle = (likeIndex * 360) / totalLikes;
                      const radius = Math.min(30 + (likeIndex % 4) * 15, 50);
                      const centerX = 50;
                      const centerY = 50;
                      const x =
                        centerX + Math.cos((angle * Math.PI) / 180) * radius;
                      const y =
                        centerY + Math.sin((angle * Math.PI) / 180) * radius;

                      return (
                        <motion.div
                          key={likeIndex}
                          className="absolute"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 0.6, 0.6, 0.6],
                            scale: [0, 1.3, 1, 0.9],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: likeIndex * 0.15,
                            ease: "easeInOut",
                          }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.4, 1],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <TbHeart
                              className="w-10 h-10 text-red-500"
                              fill="currentColor"
                              style={{
                                filter:
                                  "drop-shadow(0 0 12px rgba(239, 68, 68, 0.9))",
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              )}

            {/* Overlay com informações (opcional) */}
            {photos[currentIndex]?.title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8"
              >
                <p className="text-white text-xl font-semibold">
                  {photos[currentIndex].title}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de posição */}
      <div className="absolute bottom-20 left-0 right-0 px-4 z-10 flex justify-center">
        <div className="flex gap-1.5 max-w-full overflow-hidden">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 flex-shrink-0 ${
                index === currentIndex ? "w-8 bg-white" : "w-1 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
