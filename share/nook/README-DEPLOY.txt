Nook cabinet page: upload instructions
=======================================

Target address: https://servanting.ca/share/nook/

1. Upload the contents of this folder so the files end up at:
     /share/nook/index.html
     /share/nook/files/...     (ZIP, DXF, SVG, CSV)
     /share/nook/assets/...    (preview image, icon)
   If you upload the whole "share" folder from the ZIP, it is already laid out correctly.

2. Open https://servanting.ca/share/nook and https://servanting.ca/share/nook/ (with and without the final slash).
   Both work: the page fixes its own relative links.

3. Check the download links, then paste the address into a messaging app to confirm the preview image appears.
   Social sites cache previews. If you change the image later, re-scrape the link with the site's sharing debugger.

Notes
- The page is one self-contained index.html. The only outside request is Google Fonts, and the page falls back to system fonts if it is blocked.
- DXF files download as plain links. If your server tries to display them, add: AddType application/dxf .dxf
- To keep the page out of search results, add this line inside <head>:  <meta name="robots" content="noindex">
- Every file is static. There is no server code, database or build step.
- "Rebuilt for your measurements" files are generated in the visitor's browser, so nothing is stored on your server.
- To change the starting values or the plans, regenerate the folder and replace the files. The links stay the same.
