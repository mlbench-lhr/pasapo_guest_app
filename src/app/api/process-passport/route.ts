import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const sessionId = req.headers.get("session");
    if (!sessionId) {
        return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
    }

    const form = await req.formData();
    const apiKey = form.get("api_key") as string;
    const email = form.get("email") as string;
    const image = form.get("image") as File;

    const backendForm = new FormData();
    backendForm.append("api_key", apiKey);
    const dataObject = { email };
    backendForm.append("data", JSON.stringify(dataObject));
    backendForm.append("image", image, "passport.jpg");

    try {
        const backendRes = await fetch(process.env.NEXT_PUBLIC_LOCAL_URL + "/user/scan_passport", {
            method: "POST",
            headers: {
                "Session": sessionId
            },
            body: backendForm
        });

        const contentType = backendRes.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await backendRes.json();
        } else {
            const text = await backendRes.text();
            console.error("Non-JSON response:", text);
            return NextResponse.json({ error: "Unexpected backend response" }, { status: 500 });
        }

        if (!backendRes.ok) {
            return NextResponse.json({ error: data.message }, { status: backendRes.status });
        }

        return NextResponse.json({ data }, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
