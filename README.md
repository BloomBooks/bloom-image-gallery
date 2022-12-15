Currently, this is just the start of a project to re-implement the existing libpalaso Image Toolbox as react component.

## Stack

- [ViteJS](https://vitejs.dev/)
- Typescript
- [MUI](https://mui.com/)
- [Emotion](https://emotion.sh)
- [Axios](https://axios-http.com/) (for calling API functions)
- [Express](https://expressjs.com/) (for backend server used for API development and image collection access)
- [concurrently](https://github.com/open-cli-tools/concurrently) (to run front end and back end at same time for development)

## Design

It might eventually look something like this:
![image](https://user-images.githubusercontent.com/8448/147300507-7bba8dd1-b7e7-4125-ab36-851580170b86.png)

## Project setup

```
yarn install
```

### Compiles both front end and back end

```
yarn build
```

### Recompile with hot-reload for front end development, running back end in parallel

```
yarn dev
```

## API functions

### http://localhost:5000/image-toolbox/collections

This determines which image collections are available and which languages are available
for looking up image tags. The returned value looks something like this:

```
    { collections: ["Art of Reading"], languages: ["en","es","fr"] }
```

### http://localhost:5000/image-toolbox/search/:collection/:lang/:term

This searches the given collection for the given tag (term) in the given language. An
actual API call might look something like this:

```
    http://localhost:5000/image-toolbox/search/Art%20of%20Reading/en/cat
```

Note that the _:collection_ and _:term_ values must be URI encoded. The _:lang_ value is
the standard language tag. The return value is an array of URI encoded relative paths to
selected images, something like this:

```
    ["Brazil%2faor_123G.png","Mexico%2fA-OF%2faor_AX23.png","Zambia%2faor_ZA438.png"]
```

(Note that %2f is the URI encoding of the / character.)

### http://localhost:5000/image-toolbox/collection-image-file/:collection/:file

This returns the content of the given image file from the given collection. An actual
API call would look something like this:

```
    http://localhost:5000/image-toolbox/collection-image-file/Art%20of%20Reading/Brazil%2faor_123G.png
```

The _:collection_ value is one returned by the `image-toolbox/collections` API call and
the _:file_ value is one returned by a `image-toolbox/search` API call which used the
same _:collection_ value.

### http://localhost:5000/image-toolbox/collection-image-properties/:collection/:file

This returns some properties of the given file from the given collection. An actual
API call would look something like this:

```
    http://localhost:5000/image-toolbox/collection-image-properties/Art%20of%20Reading/Brazil%2faor_123G.png
```

The _:collection_ value is one returned by the `image-toolbox/collections` API call and
the _:file_ value is one returned by a `image-toolbox/search` API call which used the
same _:collection_ value. The return value would look something like this:

```
    { size: 25387, type: "PNG" }
```

### http://localhost:5000/image-toolbox/file-dialog

This causes a file chooser dialog to pop up (eventually -- it may take several seconds)
to allow the chooser to choose an image file from anywhere in the file system. The
return value is the full absolute path of the selected image file. (There are no
variables associated with this API call.)

### http://localhost:5000/image-toolbox/image-file/:filepath

This returns the content of the given image file chosen by an earlier call to
`image-toolbox/file-dialog`. The _:filepath_ value is URI encoded. An actual API call
might look like this:

```
    http://localhost:5000/image-toolbox/image-file/C%3A%5CUsers%5Csteve%5CPictures%5CNebula.jpg
```

Note that the _:filepath_ value is the URI encode absolute path of the image file.

### http://localhost:5000/image-toolbox/image-properties/:filepath

This returns some properties of the given image file. An actual API call would look
something like this:

```
    http://localhost:5000/image-toolbox/image-properties/C%3A%5CUsers%5Csteve%5CPictures%5CNebula.jpg
```

The _:filepath_ value is one returned by the `image-toolbox/file-dialog` API call, but
URI encoded. The return value would look something like this:

```
    { size: 5295387, type: "JPEG" }
```
