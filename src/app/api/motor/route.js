import clientPromise from "@/lib/mongodb";

let lastKnownReference = 0;

function getJakartaTime() {
  const date = new Date();
  date.setHours(date.getHours() + 7);
  return date;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("tubes_iiot");

    // Fetch latest data from all collections
    const [speed, reference, vsdStatus, mode, direction, current] =
      await Promise.all([
        db.collection("speed").findOne({}, { sort: { timestamp: -1 } }),
        db
          .collection("reference") // Added reference collection
          .findOne({}, { sort: { timestamp: -1 } }),
        db.collection("vsdstatus").findOne({}, { sort: { timestamp: -1 } }),
        db.collection("mode").findOne({}, { sort: { timestamp: -1 } }),
        db.collection("direction").findOne({}, { sort: { timestamp: -1 } }),
        db
          .collection("current") // Added current collection
          .find({})
          .sort({ timestamp: -1 })
          .limit(20)
          .toArray(),
      ]);

    if (reference?.value) {
      lastKnownReference = reference.value;
    }

    const latestDataTime = Math.max(
      new Date(speed?.timestamp || 0),
      new Date(vsdStatus?.timestamp || 0),
      new Date(mode?.timestamp || 0),
      new Date(direction?.timestamp || 0),
      new Date(current[0]?.timestamp || 0)
    );

    const jakartaTime = getJakartaTime();

    // Check if latest data is more than 5 seconds old
    const isDataStale = jakartaTime - latestDataTime > 5000;

    return Response.json({
      // Speed data
      speed: isDataStale ? 0 : speed?.value || 0,

      // Reference Speed
      referenceSpeed: reference?.value || lastKnownReference,

      // VSD Status
      vsdStatus: vsdStatus?.status || "OFF",

      // Operation Mode
      mode: isDataStale ? "No Mode Active" : mode?.mode || "No Mode Active",

      // Direction
      direction: isDataStale
        ? "No Action"
        : direction?.direction || "No Action",

      // Current History
      current: current.map((c) => ({
            value: c.value,
            timestamp: c.timestamp,
          })),

          timestamp: new Date().toISOString(),

      // Add both timestamps for debugging
      lastDataTimestamp: new Date(latestDataTime).toISOString(),
      currentTimestamp: jakartaTime.toISOString(),
      isStale: jakartaTime - latestDataTime > 5000,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
