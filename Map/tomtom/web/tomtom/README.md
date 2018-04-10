TomTom JavaScript SDK 3.0.0
==============

Documentation
--------------

Please refer to *http://developer.tomtom.com* for detailed documentation with examples.
Also latest version of the SDK can be found there.

Package content
--------------

The package contains the following files:
-tomtom.min.js - main library JavaScript, file is minified and do not need any external dependencies
-tomtom.min.js.map - a source map, allowing easy debugging in moder browsers shows the code prior to minification
-map.css - the CSS stylesheet needed by the liberary, it is necessary to link it in your HTML file
-LICENSE.txt - license file
-README.md - this file
-images/ - the images needed by the library, mainly those are fallback PNGs for older browsers, the default graphics are SVGs placed inline in CSS file

Getting started
--------------

Please check the examples for better understanding of the common use cases. The minimal *HTML* page allowing to display
the TomTom map could look like this:

    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="map.css"/>
            <script src="tomtom.min.js"></script>
        </head>
        <body style="width: 100%; height: 100%; margin: 0; padding: 0;">
            <div id="map" style="width: 100%; height: 100%;"></div>
            <script>
                tomtom.key("${api.key}");
                var map = tomtom.map("map");
            </script>
        </body>
    </html>

Please note that you need to have a valid **api key** that can be obtained via *http://developer.tomtom.com*

License
--------------

Copyright 2016 TomTom International B.V.
The library is licensed under Apache License Version 2.0, check LICENSE.txt for details.