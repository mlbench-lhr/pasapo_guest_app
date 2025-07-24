import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { session_id, api_key } = body;

    if (!session_id || !api_key) {
        return NextResponse.json(
            { error: 'Missing session_id or api_key' },
            { status: 400 }
        );
    }
    try {
        const backendRes = await fetch(process.env.NEXT_PUBLIC_LOCAL_URL + "/guest/get_link_status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                api_key: api_key,
                data: {
                    link_id: session_id
                }
            })
        });

        const data = await backendRes.json();
        if (!backendRes.ok) {
            return NextResponse.json({ error: data.message }, { status: backendRes.status });
        }

        return NextResponse.json({ data }, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
