import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "REMOVE_BG_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const incomingForm = await request.formData();
    const image = incomingForm.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "No image file was provided.",
        },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "The uploaded file is not an image.",
        },
        { status: 400 }
      );
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "Image must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    const formData = new FormData();

    formData.append("image_file", image);
    formData.append("size", "preview");
    formData.append("format", "png");

    const response = await fetch(
      "https://api.remove.bg/v1.0/removebg",
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMessage = `Background removal failed (${response.status}).`;

      try {
        const errorData = await response.json();

        if (
          errorData?.errors?.[0]?.title
        ) {
          errorMessage =
            errorData.errors[0].title;
        }
      } catch {
        // Keep default error message.
      }

      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: response.status }
      );
    }

    const result = await response.arrayBuffer();

    return new Response(result, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Remove background API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove the image background.",
      },
      { status: 500 }
    );
  }
}