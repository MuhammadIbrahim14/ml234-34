import { useState } from "react";
import { Leaf } from "lucide-react";

export default function Img({ src, alt = "", className = "" }) {
  const list = Array.isArray(src) ? src : [src];
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return <div className={"img-fb " + className}><Leaf size={22} /><span>{alt}</span></div>;
  return (
    <img
      src={list[i]} alt={alt} loading="lazy"
      className={className + (loaded ? " loaded" : "")}
      onLoad={() => setLoaded(true)}
      onError={() => (i < list.length - 1 ? setI(i + 1) : setFailed(true))}
    />
  );
}
