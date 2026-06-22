import ImageSlot from "./ImageSlot";

export default function Gallery({ slots, alt }: { slots: string[]; alt: string }) {
  return (
    <div className="gallery">
      {slots.map((s) => (
        <ImageSlot key={s} slot={s} alt={alt} ratio="4 / 3" />
      ))}
    </div>
  );
}
