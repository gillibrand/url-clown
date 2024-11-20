# <img src="./icons/icon128.png" width="42" alt="clown head" valign="bottom"> URL Clown

A Chrome extension to easily decode and edit URL query and hash parameters. Available on the [Chrome Web Store](https://chromewebstore.google.com/detail/url-clown/alcebgboodppnkoioknieomnkoknjhnf).

<img src="store-images/screenshot.png">

## How to use

Open and make a change. Click `Save` to update the URL on the current tab.

`Path` edits the path. It is shown decoded.

`Query (?)` edits the query params and can add new one. They are shown decoded. Params can have a name without a value.

`Hash (#)` edits the hash, or URL fragment, and works in two ways. If there is one entry, and it's only a name, then it is used as-as and is a traditional URL fragment. If there are name, value pairs, then the hash section is encoded and treated just like query params. This is not a browser standard, but is a common convention for single page apps that encode state information in the hash.

## How to build

There is no required build step for development. Tell Chrome to `Load unpacked` the root directory and will load it and any changes.

Use `npm run build` for a final optimized build to `dist`. Assumes a `bash` shell.

## FAQ

1. Why "clown"?

   Because most Chrome extensions are boring checkmarks, hash symbols, and weird blobs already. Clowns are fun. Or scary. Just like URLs.

2. Yet another URL editor extension?

   Yes. None that I found work with URL encoded hash params.
