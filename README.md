# prisma denodb genator

### Install

```
npm install prisma-denodb-generator
```

### Usage

Include generator in your prisma schema. use import to specify where denodb should be imported from.

```
generator denodb {
  provider = "prisma-denodb-generator"
  output   = "../generated/db.ts"
  import   = "https://deno.land/x/denodb@v1.0.40/mod.ts"
}
```

### Experimental

This package only implements a subset of the prisma schema spec. Verify the output manually before using on it.
