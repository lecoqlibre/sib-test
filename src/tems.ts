import { DatasetCoreRdfjs, Fetch, Loader, LoaderQuadStream, LoggingEntry, NamedNode, Quad, Semantizer, Stream } from "@semantizer/types";
import { EntryStreamTransformerDefaultImpl, indexFactory } from "@semantizer/mixin-index";
import { IndexQueryingStrategyShaclDefaultImpl } from "@semantizer/utils-index-querying-strategy-shacl";
import { IndexStrategyFinalShapeDefaultImpl } from "@semantizer/utils-index-querying-strategy-shacl-final";
import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import ParserJsonld from '@rdfjs/parser-jsonld';
import SemantizerImpl, { ConfigurationImpl, DatasetBaseFactoryImpl, MixinFactoryImpl } from "@semantizer/core";
import { DatasetCoreRdfjsImpl } from "@semantizer/core-rdfjs";
import { DatasetMixin } from "@semantizer/mixin-dataset";
import { ValidatorImpl } from "@semantizer/utils-shacl-validator-default";
import N3 from "n3";
import { Readable } from 'stream';

declare global {
    var SEMANTIZER: Semantizer;
}

class LoaderTems implements Loader {

    public async load(uri: string, otherFetch?: Fetch): Promise<DatasetCoreRdfjs<Quad, Quad>> {
        let response = await fetch(uri, {
            "method": "GET",
            "headers": {
                "Accept": "application/ld+json",
                "X-Bypass-Policy": "true"
            }
        });
        const responseText = await response.text();
        const input = new Readable({
            read: () => {
                input.push(responseText)
                input.push(null)
            }
        });
        const parserJsonld = new ParserJsonld()
        const quads = parserJsonld.import(input);
        let resDataset = datasetFactory.dataset();
        const quadsRes = new Promise<DatasetCoreRdfjs>((resolve, reject) => {
            quads.on('data', (quad: Quad) => {
                resDataset.add(quad);
                if (quad === null) {
                    resolve(resDataset);
                }
            });
            quads.on('end', () => {
                resolve(resDataset);
            });
            quads.on('error', (error) => {
                reject(error);
            });
        });

        return quadsRes;

    }

}

class LoaderQuadStreamTems implements LoaderQuadStream {

    public async load(uri: string, otherFetch?: Fetch): Promise<Stream<Quad>> {
        let response = await fetch(uri, {
            "method": "GET",
            "headers": {
                "Accept": "application/ld+json",
                "X-Bypass-Policy": "true"
            }
        });
        const responseText = await response.text();
        const input = new Readable({
            read: () => {
                input.push(responseText)
                input.push(null)
            }
        });
        const parserJsonld = new ParserJsonld()
        const quads = parserJsonld.import(input);

        return quads;

    }

}

const semantizer: Semantizer = new SemantizerImpl(
    new ConfigurationImpl({
        loader: new LoaderTems(),
        loaderQuadStream: new LoaderQuadStreamTems(),
        datasetImpl: DatasetMixin(DatasetCoreRdfjsImpl),
        rdfModelDataFactory: dataFactory,
        mixinFactoryImpl: MixinFactoryImpl,
        datasetBaseFactoryImpl: DatasetBaseFactoryImpl
    })
);

Object.defineProperty(globalThis, "SEMANTIZER", {
    value: semantizer,
    writable: false, // can't be modified
    configurable: false, // can't be deleted
});

semantizer.enableLogging();
semantizer.registerEntryCallback((logEntry: LoggingEntry) => console.log(logEntry.level, logEntry.message));

const index = await semantizer.load("https://api.tems-dev3.startinblox.com/indexes/objects/trial8/index", indexFactory);

const targetShapeTurtle = `
        @prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <http://schema.org/> .
    @prefix idx: <https://ns.inria.fr/idx/terms#>.
    @prefix sib: <https://cdn.startinblox.com/owl#>.
    @prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.

    idx:IndexEntry
    a rdfs:Class, sh:NodeShape ;
    sh:closed false;
    sh:property [
    	sh:path idx:hasTarget;
        sh:minCount 1;
    ];
    sh:property [
        sh:path idx:hasShape ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:property [
        	sh:path sh:property ;
        	sh:minCount 1;
            sh:qualifiedValueShape 
                [
                    sh:and (
                        [ sh:path sh:path ; sh:hasValue rdf:type ] 
                        [ sh:path sh:hasValue; sh:hasValue tems:3DObject ]
                    )
                ], 
                [
                    sh:and (
                        [ sh:path sh:path; sh:hasValue sib:title ]
                        [ sh:path sh:pattern; sh:hasValue "ind.*"  ]
                    )
                ];
			sh:qualifiedMinCount 1 ;
        ];
    ].
    `;

const finalIndexShapeTurtle = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <http://schema.org/> .
    @prefix idx: <https://ns.inria.fr/idx/terms#>.
    @prefix sib: <https://cdn.startinblox.com/owl#>.
    @prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape 
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ] 
                    [ sh:path sh:hasValue; sh:hasValue tems:3DObject ]
                )
            ], 
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue sib:title ]
                    [ sh:path sh:pattern; sh:hasValue "ind.*"  ]
                )
            ];
        sh:qualifiedMinCount 1 ;
    ];
].
`;

const subIndexShapeTurtle = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <http://schema.org/> .
    @prefix idx: <https://ns.inria.fr/idx/terms#>.
    @prefix sib: <https://cdn.startinblox.com/owl#>.
    @prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
#sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape 
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ] 
                    [ sh:path sh:hasValue; sh:hasValue tems:3DObject ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue sib:title ] 
                    [ sh:path sh:hasValue ; sh:maxCount 0 ]
                )
            ];
        sh:qualifiedMinCount 1;            
    ]
].
`;

const parser = new N3.Parser({ format: 'text/turtle' });

const targetShape = semantizer.build();
targetShape.addAll(parser.parse(targetShapeTurtle));

const finalIndexShape = semantizer.build();
finalIndexShape.addAll(parser.parse(finalIndexShapeTurtle));

const subIndexShape = semantizer.build();
subIndexShape.addAll(parser.parse(subIndexShapeTurtle));

const shaclValidator = new ValidatorImpl();
const entryTransformer = new EntryStreamTransformerDefaultImpl(semantizer);

const finalIndexStrategy = new IndexStrategyFinalShapeDefaultImpl(finalIndexShape, subIndexShape, shaclValidator, entryTransformer);
const shaclStrategy = new IndexQueryingStrategyShaclDefaultImpl(targetShape, finalIndexStrategy, shaclValidator, entryTransformer);

const resultStream = index.query(shaclStrategy);
resultStream.on('data', (result: NamedNode) => console.log("RESULT -> " + result.value));