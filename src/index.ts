import semantizer from "@semantizer/default";
import { indexFactory } from "@semantizer/mixin-index";
import { EntryStreamTransformerStrategyDefaultImpl } from "@semantizer/util-index-entry-stream-transformer";
import { DatasetRdfjs, LoggingEntry, NamedNode, ShaclValidationReport, ShaclValidationResult, ShaclValidator } from "@semantizer/types";
import { IndexQueryingStrategyShaclDefaultImpl } from "@semantizer/util-index-querying-strategy-shacl";
import { IndexQueryingStrategyShaclConjunctionDefaultImpl } from "@semantizer/util-index-querying-strategy-shacl-conjunction";
import { IndexStrategyFinalShapeDefaultImpl } from "@semantizer/util-index-querying-strategy-shacl-final";
import SHACLValidator from 'rdf-validate-shacl';
// import datasetFactory from '@rdfjs/dataset';
import DatasetCore from "@rdfjs/dataset/DatasetCore";
import Serializer from '@rdfjs/serializer-turtle';
import N3 from "n3";
import { Readable } from 'stream';

// npm link @semantizer/types @semantizer/default @semantizer/mixin-index @semantizer/mixin-shacl @semantizer/utils-index-querying-strategy-shacl-final @semantizer/utils-index-querying-strategy-shacl-comunica @semantizer/utils-index-querying-strategy-shacl @semantizer/utils-index-querying-strategy-shacl-conjunction

const shacl = 'http://www.w3.org/ns/shacl#';
const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const idx = 'https://ns.inria.fr/idx/terms#';

export const IDX = {
    namespace: idx,
    INDEX_ENTRY: idx + 'IndexEntry',
    HAS_SUB_INDEX: idx + 'hasSubIndex',
    HAS_TARGET: idx + 'hasTarget',
    HAS_SHAPE: idx + 'hasShape',
}

export const SHACL = {
    namespace: shacl,
    NODE_SHAPE: shacl + 'NodeShape',
    CLOSED: shacl + 'closed',
    HAS_VALUE: shacl + 'hasValue',
    PATH: shacl + 'path',
    PATTERN: shacl + 'pattern',
    PROPERTY: shacl + 'property',
    MIN_COUNT: shacl + 'minCount',
    MAX_COUNT: shacl + 'maxCount',
    NODE: shacl + 'node',
    QUALIFIED_VALUE_SHAPE: shacl + 'qualifiedValueShape',
    QUALIFIED_MIN_COUNT: shacl + 'qualifiedMinCount'
}

export const RDF = {
    namespace: rdf,
    TYPE: rdf + 'type',
}

const main = async () => {
    semantizer.getConfiguration().enableLogging();
    semantizer.getConfiguration().registerLoggingEntryCallback((logEntry: LoggingEntry) => console.log(logEntry.level, logEntry.message));
    const index = await semantizer.load("http://localhost:8000/root.jsonld", indexFactory);

    const targetShapeTurtle = `
        @prefix sh: <http://www.w3.org/ns/shacl#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <http://schema.org/> .
    @prefix idx: <https://ns.inria.fr/idx/terms#>.
    @prefix ex: <http://example.org#>.
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
                        [ sh:path sh:hasValue; sh:hasValue ex:User ]
                    )
                ], 
                [
                    sh:and (
                        [ sh:path sh:path; sh:hasValue ex:skills ]
                        [ sh:path sh:hasValue; sh:hasValue ex:skill-engineer, ex:skill-logistics ]
                    )
                ];
			sh:qualifiedMinCount 1 ;
        ];
    ].
    `;

    const targetShapeEngineerTurtle = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix ex: <http://example.org#>.
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
                    [ sh:path sh:hasValue; sh:hasValue ex:User ]
                )
            ], 
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ex:skills ]
                    [ sh:path sh:hasValue; sh:hasValue ex:skill-engineer ]
                )
            ];
        sh:qualifiedMinCount 1 ;
    ];
].
`;

    const targetShapeLogisticsTurtle = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix ex: <http://example.org#>.
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
                [ sh:path sh:hasValue; sh:hasValue ex:User ]
            )
        ], 
        [
            sh:and (
                [ sh:path sh:path; sh:hasValue ex:skills ]
                [ sh:path sh:hasValue; sh:hasValue ex:skill-logistics ]
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
    @prefix ex: <http://example.org#>.
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
                        [ sh:path sh:hasValue; sh:hasValue ex:User ]
                    )
                ], 
                [
                    sh:and (
                        [ sh:path sh:path; sh:hasValue ex:skills ]
                      	[
                          sh:or (
                            [ sh:path sh:hasValue; sh:hasValue ex:skill-engineer ]
                            [ sh:path sh:hasValue; sh:hasValue ex:skill-logistics ]
                          )
                        ]
                    )
                ];
			sh:qualifiedMinCount 1 ;
        ];
    ].
    `;

    const finalIndexShapeEngineerTurtle = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix ex: <http://example.org#>.
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
                    [ sh:path sh:hasValue; sh:hasValue ex:User ]
                )
            ], 
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ex:skills ]
                    [ sh:path sh:hasValue; sh:hasValue ex:skill-engineer ]
                )
            ];
        sh:qualifiedMinCount 1 ;
    ];
].
`;

    const finalIndexShapeLogisticsTurtle = `
    @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix ex: <http://example.org#>.
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
                    [ sh:path sh:hasValue; sh:hasValue ex:User ]
                )
            ], 
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ex:skills ]
                    [ sh:path sh:hasValue; sh:hasValue ex:skill-logistics ]
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
@prefix ex: <http://example.org#>.
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
                        [ sh:path sh:hasValue; sh:hasValue ex:User ]
                    )
                ],
                [
                    sh:and (
                        [ sh:path sh:path ; sh:hasValue ex:skills ] 
                        [ sh:path sh:hasValue ; sh:maxCount 0 ]
                    )
                ];
            sh:qualifiedMinCount 1;            
        ]
    ].
    `;

    const sparqlQuery = `PREFIX idx: <https://ns.inria.fr/idx/terms#>
            PREFIX sh: <http://www.w3.org/ns/shacl#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX ex: <http://example.org#>

            SELECT DISTINCT ?result WHERE {
                ?prop0 a idx:IndexEntry;
                idx:hasShape [
                    sh:property [
                        sh:path ex:skills;
                        sh:hasValue ex:skill-engineer
                    ]
                ];
                idx:hasTarget ?result.
            } LIMIT 5`;

    const parser = new N3.Parser({ format: 'text/turtle' });

    const targetShape = semantizer.build();
    targetShape.addAll(parser.parse(targetShapeTurtle));

    const targetShapeEngineer = semantizer.build();
    targetShapeEngineer.addAll(parser.parse(targetShapeEngineerTurtle));

    const targetShapeLogistics = semantizer.build();
    targetShapeLogistics.addAll(parser.parse(targetShapeLogisticsTurtle));

    const finalIndexShape = semantizer.build();
    finalIndexShape.addAll(parser.parse(finalIndexShapeTurtle));

    const finalIndexShapeEngineer = semantizer.build();
    finalIndexShapeEngineer.addAll(parser.parse(finalIndexShapeEngineerTurtle));

    const finalIndexShapeLogistics = semantizer.build();
    finalIndexShapeLogistics.addAll(parser.parse(finalIndexShapeLogisticsTurtle));

    const subIndexShape = semantizer.build();
    subIndexShape.addAll(parser.parse(subIndexShapeTurtle));

    const shaclValidator = new ValidatorImpl();
    const entryTransformer = new EntryStreamTransformerStrategyDefaultImpl(semantizer);

    // const finalIndexStrategy = new IndexStrategyFinalShapeDefaultImpl(finalIndexShape, subIndexShape, shaclValidator, entryTransformer);
    // const comunicaStrategy = new IndexStrategySparqlComunica(sparqlQuery, finalIndexShape, finalIndexStrategy, shaclValidator, entryTransformer);
    // const shaclStrategy = new IndexQueryingStrategyShaclDefaultImpl(targetShape, finalIndexStrategy, shaclValidator, entryTransformer);

    const finalIndexEngineerStrategy = new IndexStrategyFinalShapeDefaultImpl(finalIndexShapeEngineer, subIndexShape, shaclValidator, entryTransformer);
    const finalIndexLogisticsStrategy = new IndexStrategyFinalShapeDefaultImpl(finalIndexShapeLogistics, subIndexShape, shaclValidator, entryTransformer);
    const shaclStrategyEngineer = new IndexQueryingStrategyShaclDefaultImpl(targetShapeEngineer, finalIndexEngineerStrategy, shaclValidator, entryTransformer);
    const shaclStrategyLogistics = new IndexQueryingStrategyShaclDefaultImpl(targetShapeLogistics, finalIndexLogisticsStrategy, shaclValidator, entryTransformer);
    const conjunctionStrategy = new IndexQueryingStrategyShaclConjunctionDefaultImpl([shaclStrategyEngineer, shaclStrategyLogistics], entryTransformer);

    const resultStream = index.mixins.index.query(conjunctionStrategy);
    resultStream.on('data', (result: NamedNode) => console.log(result.value));

    // await new Promise((resolve, reject) => {
    //     resultStream.on('end', resolve);
    //     resultStream.on('error', (error) => reject(error));
    // });

    // console.log("Finish");
}

type ValidationReport = Awaited<ReturnType<SHACLValidator["validate"]>>;

class ValidatorImpl implements ShaclValidator {

    public async validate(shapeGraph: DatasetRdfjs, dataGraph: DatasetRdfjs): Promise<ShaclValidationReport> {
        const validator = new SHACLValidator(shapeGraph, {});
        const validationReport = await validator.validate(dataGraph);
        return new ValidationReportImpl(validationReport);
    }

}

class ValidationReportImpl implements ShaclValidationReport {

    private _validationReport: ValidationReport;

    public constructor(validationReport: ValidationReport) {
        this._validationReport = validationReport;
    }

    doConforms(): boolean {
        return this._validationReport.conforms;
    }

    getResults(): ShaclValidationResult[] {
        throw new Error("Method not implemented.");
    }

}

main();

const serialize = async (dataset: DatasetRdfjs) => {
    const serializerEntry = new Serializer();
    const inputEntry = Readable.from(dataset as DatasetCore);
    const outputEntry = serializerEntry.import(inputEntry);
    outputEntry.on('data', (data) => console.log(data));
    return new Promise((resolve, reject) => {
        outputEntry.on('error', reject);
        outputEntry.on('end', resolve)
    });
    // @ts-ignore
    // outputEntry.pipe(process.stdout);
}

const _global = global as any;
_global.serialize = serialize

// console.log(entry);

// const createBlankNode = () => index.getSemantizer().getConfiguration().getRdfDataModelFactory().blankNode();

// const dataset = semantizer.build();
// dataset.setBaseUri(IDX.INDEX_ENTRY);
// dataset.addObjectUri(dataset.getBaseUri(), RDF.TYPE, SHACL.NODE_SHAPE);
// dataset.addObjectUri(dataset.getBaseUri(), RDF.TYPE, "http://www.w3.org/2000/01/rdf-schema#Class");
// dataset.addObjectBoolean(dataset.getBaseUri(), SHACL.CLOSED, "false");

// const property1 = createBlankNode();
// dataset.addObjectBlankNode(dataset.getBaseUri(), SHACL.PROPERTY, property1);
// dataset.addObjectUri(property1, SHACL.PATH, IDX.HAS_SHAPE);
// dataset.addObjectInteger(property1, SHACL.MIN_COUNT, 1);
// dataset.addObjectInteger(property1, SHACL.MAX_COUNT, 1);

// const property2 = createBlankNode();
// dataset.addObjectBlankNode(property1, SHACL.PROPERTY, property2);
// dataset.addObjectUri(property2, SHACL.PATH, SHACL.PROPERTY);
// dataset.addObjectInteger(property2, SHACL.MIN_COUNT, 1);

// const qualifiedValueShape = createBlankNode();
// dataset.addObjectBlankNode(property2, SHACL.QUALIFIED_VALUE_SHAPE, qualifiedValueShape);
// dataset.addObjectUri(qualifiedValueShape, SHACL.PATH, SHACL.PATH);
// dataset.addObjectUri(qualifiedValueShape, SHACL.HAS_VALUE, "https://cdn.startinblox.com/owl#firstName");

// dataset.addObjectInteger(property2, SHACL.QUALIFIED_MIN_COUNT, 1);


// Print entry
// const serializerEntry = new Serializer();
// const inputEntry = Readable.from(entry as DatasetCore);
// const outputEntry = serializerEntry.import(inputEntry);
// // @ts-ignore
// outputEntry.pipe(process.stdout);

// Print shape
// const serializerShape = new Serializer();
// const input = Readable.from(dataset);
// const output = serializerShape.import(input);
// // @ts-ignore
// output.pipe(process.stdout);

// const validator = new SHACLValidator(dataset, {});
// const report = await validator.validate(entry as DatasetCore);
// console.log(report.conforms);

// for (const result of report.results) {
//     // See https://www.w3.org/TR/shacl/#results-validation-result for details
//     // about each property
//     console.log(result.message);
//     console.log(result.path);
//     console.log(result.focusNode);
//     console.log(result.sourceShape);
//     console.log(result.sourceConstraintComponent);
// }