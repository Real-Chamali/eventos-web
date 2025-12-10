'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'

// Utility function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// Icon components
const ChevronDown = ({ className }: { className?: string }) => (
  <span className={className || 'text-slate-400'}>▼</span>
)
const ChevronUp = ({ className }: { className?: string }) => (
  <span className={className || 'text-slate-400'}>▲</span>
)
const BarChart3 = ({ className }: { className?: string }) => (
  <span className={className || ''}>📊</span>
)

interface QuoteVersion {
  version_number: number
  status: string
  total_price: number
  services: Array<{
    service_id: string
    quantity: number
    final_price: number
  }>
  created_by_name: string | null
  created_at: string
}

interface QuoteHistorySummary {
  quote_id: string
  total_versions: number
  current_version: number
  versions: QuoteVersion[]
  created_at: string
  last_modified_at: string
}

interface ComparisonField {
  field_name: string
  version1_value: string | null
  version2_value: string | null
  changed: boolean
}

export default function QuoteHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { success, error: showError } = useToast()
  const [paramId, setParamId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<QuoteHistorySummary | null>(null)
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null)
  const [comparison, setComparison] = useState<ComparisonField[]>([])
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    const unwrap = async () => {
      const p = await params
      setParamId(p.id)
    }
    unwrap()
  }, [params])

  // Fetch quote history
  useEffect(() => {
    if (!paramId) return

    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/quotes/${paramId}/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch history')
        }

        setHistory(data.data)
        success('History loaded')
      } catch (error) {
        logger.error('dashboard/quotes/history', 'Error fetching quote history', error instanceof Error ? error : new Error(String(error)), {
          quoteId: paramId,
        })
        showError('Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [paramId, success, showError])

  // Compare versions
  const handleCompare = async (v1: number, v2: number) => {
    if (v1 === v2) {
      showError('Select different versions')
      return
    }

    try {
      setComparing(true)
      const response = await fetch(`/api/quotes/${paramId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version1: Math.min(v1, v2),
          version2: Math.max(v1, v2),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to compare versions')
      }

      setComparison(data.data)
      setSelectedVersions([Math.min(v1, v2), Math.max(v1, v2)])
      success('Comparison loaded')
    } catch (error) {
      logger.error('dashboard/quotes/history', 'Error comparing versions', error instanceof Error ? error : new Error(String(error)), {
        quoteId: paramId,
      })
      showError('Failed to compare versions')
    } finally {
      setComparing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!history) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
              Quote not found
            </h2>
            <p className="text-amber-700 dark:text-amber-300 mt-2">
              The quote history could not be loaded.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const sortedVersions = [...history.versions].sort((a, b) => a.version_number - b.version_number)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Quote History
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Quote ID: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm">{paramId}</code>
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Versions</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {history.total_versions}
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatRelativeTime(history.created_at)}
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Modified</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatRelativeTime(history.last_modified_at)}
            </div>
          </div>
        </div>

        {/* Compare Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setSelectedVersions(null)
              setComparison([])
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              compareMode
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {compareMode ? 'Exit Compare' : 'Compare Versions'}
          </button>
        </div>

        {/* Versions List */}
        <div className="space-y-4">
          {sortedVersions.map((version) => (
            <div
              key={version.version_number}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
            >
              {/* Version Header */}
              <button
                onClick={() => {
                  if (compareMode && selectedVersions && selectedVersions.length === 2) {
                    // In compare mode, selecting both versions triggers comparison
                    if (selectedVersions[0] === version.version_number ||
                        selectedVersions[1] === version.version_number) {
                      setSelectedVersions(null)
                    }
                  } else {
                    setExpandedVersion(expandedVersion === version.version_number ? null : version.version_number)
                  }
                }}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  {compareMode && (
                    <input
                      type="checkbox"
                      checked={selectedVersions?.includes(version.version_number) || false}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          if (!selectedVersions) {
                            setSelectedVersions([version.version_number, version.version_number])
                          } else if (selectedVersions[0] === selectedVersions[1]) {
                            setSelectedVersions([
                              Math.min(selectedVersions[0], version.version_number),
                              Math.max(selectedVersions[0], version.version_number),
                            ])
                          }
                        } else {
                          setSelectedVersions(null)
                        }
                      }}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 px-3 py-1 rounded-full">
                        v{version.version_number}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        version.status === 'accepted'
                          ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200'
                          : version.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200'
                            : 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                      }`}>
                        {version.status}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        ${version.total_price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      by {version.created_by_name || 'System'} •{' '}
                      {formatRelativeTime(version.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!compareMode && (
                    <>
                      {expandedVersion === version.version_number ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </>
                  )}
                </div>
              </button>

              {/* Version Details */}
              {!compareMode && expandedVersion === version.version_number && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Services</h4>
                      <div className="space-y-2">
                        {version.services.map((service, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800 rounded"
                          >
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              Service {service.service_id.slice(0, 8)}... x{service.quantity}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              ${service.final_price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compare Button for Selected Versions */}
              {compareMode &&
                selectedVersions &&
                selectedVersions[0] !== selectedVersions[1] &&
                (version.version_number === selectedVersions[0] ||
                  version.version_number === selectedVersions[1]) && (
                  <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950">
                    {version.version_number === selectedVersions[1] && (
                      <button
                        onClick={() => handleCompare(selectedVersions[0], selectedVersions[1])}
                        disabled={comparing}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {comparing ? 'Comparing...' : 'Compare Versions'}
                      </button>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Comparison Result */}
        {selectedVersions && comparison.length > 0 && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4">
              Comparison: Version {selectedVersions[0]} → Version {selectedVersions[1]}
            </h2>
            <div className="space-y-3">
              {comparison.map((change, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    change.changed
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                      : 'bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 opacity-50'
                  }`}
                >
                  <div className="font-medium text-blue-900 dark:text-blue-200 capitalize">
                    {change.field_name}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <div>From: <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">{change.version1_value || 'N/A'}</code></div>
                    <div>To: <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">{change.version2_value || 'N/A'}</code></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
