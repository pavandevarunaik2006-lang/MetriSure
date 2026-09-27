import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Listen for console events
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}".encode("ascii", "replace").decode("ascii")))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))
        
        try:
            await page.goto('http://localhost:5173/login', wait_until='networkidle')
            print("Loaded page")
            # Wait a second to allow react to render or crash
            await asyncio.sleep(2)
        except Exception as e:
            print("Navigation failed:", e)
            
        await browser.close()

asyncio.run(run())
