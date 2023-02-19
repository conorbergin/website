---
title: Advent of Code 2022 in Rust
layout: post.njk
---

This is the third year I have attempted AoC, and the first time I have finished it. Last year I used Julia, which I think is actually pretty close to perfect for this sort of thing, it has an REPL, linear algebra in the standard library and a clever JIT compiler that can produce code about as performant traditional compiled languages, much more convieniently. This year I wanted to write readable, performant, and robust code, and Rust seems to me the best language for that job. Did I succeed? No. Some of my solutions are nice, some are really not. I didn't do much clean up work, once I reached the mid forties my enthusiam started to wane.

Rust is great, as long as you don't write too much of it. I didn't have many problems with the borrow checker becuase I didn't allocate much. The inconvinience of moving data structurea around forced me to think about what I was actually trying to do with my code.

I used itertools a lot, the iproduct! macro in particular to avoid writing nested for loops.

### Day 22, part 2

This was perhaps the hardest problem of the year. Given a map, which was also the net of a cube, follow a route, and at every edge, wrap to the matching edge if the net were folded.

### Day 25

Instead of translating snafu into base 10 and back again, I implemented adding in snafu itself

``` rust
fn snafu_add(a: &str, b: &str) -> String {
    let d = ['=', '-','0', '1', '2'];
    let r = a.chars()
        .rev()
        .zip_longest(b.chars().rev())
        .map(|z| match z {
            EitherOrBoth::Both(l,r) => (l,r),
            EitherOrBoth::Left(l)   => (l,'0'),
            EitherOrBoth::Right(r)  => ('0',r)
        })
        .fold(String::from('0'), |mut acc, e| {
            let c = acc.pop().unwrap();
            let i = d.iter().position(|x| *x == e.0).unwrap();
            let j = d.iter().position(|x| *x == e.1).unwrap();
            let k = d.iter().position(|x| *x == c).unwrap();
            acc.push(d[(i+j+k+1)%5]);
            acc.push(d[(i+j+k+1)/5+1]);
            acc
        });
    r.trim_end_matches('0').chars().rev().collect()
}
```


