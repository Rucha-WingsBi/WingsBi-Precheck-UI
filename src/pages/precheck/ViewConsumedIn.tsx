import React from "react";
import ViewPrecheck from "./ViewPrecheck";

const ViewConsumedIn: React.FC<{ hideHeader?: boolean }> = (props) => {
  return <ViewPrecheck {...props} />;
};

export default ViewConsumedIn;
