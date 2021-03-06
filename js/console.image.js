(function (console) {
    "use strict";

    /**
     * Since the console.log doesn't respond to the `display` style,
     * setting a width and height has no effect. In fact, the only styles
     * I've found it responds to is font-size, background-image and color.
     * To combat the image repeating, we have to get a create a font bounding
     * box so to speak with the unicode box characters.
     *
     * @param  {int} width  The height of the box
     * @param  {int} height The width of the box
     * @return {object}     {string, css}
     */
    function getBox(width, height) {
        return {
            string: "+",
            style: "font-size: 1px; padding: " + Math.floor(height % 2) + "px " + Math.floor(width / 2) + "px; line-height: " + height + "px;"
        }
    }

    /**
     * Display an image in the console.
     * @param  {string} url The url of the image.
     * @param  {int} scale Scale factor on the image
     * @return {null}
     */
    console.image = function (url, scale) {
        scale = scale || 1;
        var img = new Image();

        img.onload = function () {
            var dim = getBox(this.width * scale, this.height * scale);
            console.log("%c" + dim.string, dim.style + "background: url(" + url + "); background-size: " + (this.width * scale) + "px " + (this.height * scale) + "px; color: transparent;");
        };

        img.src = url;
    };
})(console);