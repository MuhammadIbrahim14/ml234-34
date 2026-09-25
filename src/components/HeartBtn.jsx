import { useState } from "react";
import { Heart } from "lucide-react";

const HeartBtn = () => {
  const [on, setOn] = useState(false);
  return (
    <button className={"heart" + (on ? " on" : "")} onClick={() => setOn(!on)} aria-label="Save to favourites">
      <Heart size={15} fill={on ? "currentColor" : "none"} />
    </button>
  );
};

export default HeartBtn;
