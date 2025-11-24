import { Button } from "@heroui/button";
import { Modal, ModalContent } from "@heroui/modal";
import { TbChevronLeft } from "react-icons/tb";
export const Search = ({
  isOpen,
  close,
}: {
  isOpen: boolean;
  close: () => void;
}) => (
  <Modal hideCloseButton isOpen={isOpen} size={"full"} onClose={close}>
    <ModalContent
      style={{
        padding: 0,
        background:
          "linear-gradient(to bottom, #e27687, #b0597d, #7a406d, #462b57, #14173a)",
      }}
    >
      <div
        className="flex items-center justify-start px-2 py-4 text-white"
        role="button"
        tabIndex={0}
        onClick={close}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            close();
          }
        }}
      >
        <TbChevronLeft className="w-7 h-7" />
      </div>
      <div className="flex items-center justify-center h-full flex-col gap-4 p-8">
        <span className="text-md font-bold text-white">
          Participe dos Momentos
        </span>
        <span className="text-white text-sm text-center font-light">
          Você pode participar de um álbum existente e inserir seus momentos e
          participar dessa grande comunidade. Insira o código do álbum para
          participar.
        </span>
        <div
          className="flex items-center mt-8 justify-center gap-2 text-white flex-col"
          style={{
            borderRadius: "10px",
            border: "1px solid #ffffff30",
            padding: "15px",
            width: "100%",
            backgroundColor: "#ffffff30",
          }}
        >
          <span className="text-sm font-bold">Insira o código do álbum</span>
          <input
            className="text-sm font-bold bg-transparent text-center border-none outline-none"
            style={{
              backgroundColor: "#ffffff30",
              borderRadius: "10px",
              padding: "10px",
              width: "100%",
              textTransform: "uppercase",
            }}
            type="text"
          />
        </div>
        <Button className="w-full" color="primary" size="lg">
          Participar
        </Button>
      </div>
    </ModalContent>
  </Modal>
);
