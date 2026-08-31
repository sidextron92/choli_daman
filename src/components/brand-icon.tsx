import Image from "next/image";
import choliDamanIcon from "@/app/icon.png";

export function BrandIcon({ size = 32 }: { size?: number }) {
  return <Image className="brand-logo" src={choliDamanIcon} alt="" width={size} height={size} />;
}
