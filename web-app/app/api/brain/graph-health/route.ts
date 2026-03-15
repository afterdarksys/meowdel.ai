import { NextResponse } from 'next/server'
import { GET as getGraphData } from '../graph/route'

export interface GraphHealthMetrics {
  totalNotes: number;
  totalLinks: number;
  orphanedNotes: { slug: string; name: string }[];
  hubNotes: { slug: string; name: string; incomingLinks: number }[];
  weakClusters: { slug: string; name: string; links: number }[];
}

export async function GET() {
  try {
    // 1. Fetch graph data by calling the graph route logic directly
    const graphResponse = await getGraphData()
    const graphData = await graphResponse.json()
    
    if (graphData.error || !graphData.nodes) {
        return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
    }

    const { nodes, links } = graphData

    const validNodes = nodes.filter((n: any) => n.color !== '#6b7280') // Exclude missing/unresolved nodes
    
    const incomingCounts = new Map<string, number>()
    const totalLinksCounts = new Map<string, number>()
    
    // Initialize counts
    for (const node of validNodes) {
        incomingCounts.set(node.id, 0)
        totalLinksCounts.set(node.id, node.outgoingLinks?.length || 0)
    }

    // Process links
    for (const link of links) {
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id

        // Only count if target is a valid node
        if (incomingCounts.has(targetId)) {
            incomingCounts.set(targetId, (incomingCounts.get(targetId) || 0) + 1)
            totalLinksCounts.set(targetId, (totalLinksCounts.get(targetId) || 0) + 1)
        }
    }

    // 2. Calculate Orphans (0 incoming OR outgoing links)
    // "Orphan" typically means isolated (no incoming and no outgoing, or just no incoming)
    // Let's define: Orphan = 0 incoming AND 0 outgoing, OR just 0 total links.
    const orphanedNotes = validNodes
        .filter((node: any) => {
            const inCount = incomingCounts.get(node.id) || 0;
            const outCount = node.outgoingLinks?.length || 0;
            return inCount === 0 && outCount === 0;
        })
        .map((n: any) => ({ slug: n.id, name: n.name }))

    // 3. Calculate Hubs (e.g. > 5 incoming links)
    const hubNotes = validNodes
        .filter((node: any) => (incomingCounts.get(node.id) || 0) >= 5)
        .map((n: any) => ({ 
            slug: n.id, 
            name: n.name,
            incomingLinks: incomingCounts.get(n.id) || 0
        }))
        .sort((a: any, b: any) => b.incomingLinks - a.incomingLinks)

    // 4. Calculate Weak Connections (< 3 total connections but > 0)
    const weakClusters = validNodes
        .filter((node: any) => {
             const total = totalLinksCounts.get(node.id) || 0
             return total > 0 && total < 3
        })
        .map((n: any) => ({
             slug: n.id,
             name: n.name,
             links: totalLinksCounts.get(n.id) || 0
        }))
        .sort((a: any, b: any) => a.links - b.links)
        .slice(0, 10) // Limit to top 10

    const metrics: GraphHealthMetrics = {
        totalNotes: validNodes.length,
        totalLinks: links.length,
        orphanedNotes,
        hubNotes,
        weakClusters
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching graph health:', error)
    return NextResponse.json({ error: 'Failed to calculate health' }, { status: 500 })
  }
}
