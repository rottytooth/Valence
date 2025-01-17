
// build all valid ASTs for a given line and add to line.asts
const build_trees = (
    line, // to add to asts list
    parentnode, // the new parent, chosen among siblings
    parentidx,  // index of the new parent
    siblings, // the parent and its siblings 
    tree // the base of the current tree (if it's complete, we'll add to asts list)
) => {

    if (!tree) {
        // if not provided, assume we are at the top of the tree
        tree = parentnode;
    }

    if (!Object.hasOwn(parentnode, 'params')) {
        parentnode.params = [];
    }
    
    if (siblings.length == 1) {
        if (check_complete(tree)) {
            tree.complete = true;
            line.asts.push(tree);
        }
        return;
    }

    if (parentidx > 0) {
        parentnode.params.push(siblings.slice(0, parentidx - 1));
    }
    parentnode.params.push(siblings.slice(parentidx + 1));

    // loop through possibilties for first child
    for (let i = 0; i < parentnode.params[0].length - 1; i++) {
        if (i > 0) {
            tree = JSON.parse(JSON.stringify(tree));
            parentnode = find_child_in_tree(new_tree, parentnode.id);
        }
        build_trees(line, parentnode, i, parentnode.params[0], tree);

        // for each possible first, find the second
        for (let j = 0; j < parentnode.params[1].length - 1; j++) {
            if (j > 0) {
                tree = JSON.parse(JSON.stringify(tree));
                parentnode = find_child_in_tree(new_tree, parentnode.id);
            }
            build_trees(line, parentnode, j, parentnode.params[1], tree);
        }
    }
}
