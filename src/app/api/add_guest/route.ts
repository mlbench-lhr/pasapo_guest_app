import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { data, api_key } = body;

    if (!data || !api_key) {
        return NextResponse.json(
            { error: 'Missing data or api_key' },
            { status: 400 }
        );
    }
    console.log(data)
    try {
        const backendRes = await fetch(process.env.NEXT_PUBLIC_LIVE_URL + "/guest/add_guest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                api_key: api_key,
                data
            })
        });

        const res = await backendRes.json();
        console.log(res)
        if (!backendRes.ok) {
            return NextResponse.json({ error: res.message }, { status: backendRes.status });
        }

        return NextResponse.json({ res }, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
